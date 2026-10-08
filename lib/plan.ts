/**
 * 데일리 플랜 생성기.
 * 커리큘럼(주차 테마·일일 신규 할당량) + 학습 상태(카드 보유 여부, 만기 수)로
 * "오늘 할 일" 목록을 결정적으로 만든다. 뒤처진 분량은 남은 날짜에 재분배한다.
 */
import { CURRICULUM, LAST_NEW_DAY, type Week, weekForDate } from "@/data/curriculum";
import type { CardContentType } from "./content/types";
import { CARD_TYPES } from "./content/types";
import { EXAM_DATE_DEFAULT, daysBetween } from "./date";

export type Intensity = "light" | "normal" | "hard";
export const INTENSITY_FACTOR: Record<Intensity, number> = { light: 0.7, normal: 1, hard: 1.3 };
export const INTENSITY_LABEL: Record<Intensity, string> = { light: "가볍게", normal: "보통", hard: "빡세게" };

export interface InventoryItem {
  id: string;
  week: number;
  priority: number;
}

export type QuizMode =
  | "kana"
  | "vocab-meaning"
  | "vocab-reading"
  | "kanji-reading"
  | "kanji-meaning"
  | "grammar-cloze"
  | "listening";

export type Task =
  | { kind: "review"; id: string; title: string; count: number; estMin: number; href: string }
  | { kind: "new"; id: string; title: string; type: CardContentType; ids: string[]; estMin: number; href: string }
  | { kind: "quiz"; id: string; title: string; mode: QuizMode; estMin: number; href: string }
  | { kind: "reading"; id: string; title: string; refId: string; estMin: number; href: string }
  | { kind: "listening"; id: string; title: string; refId: string; estMin: number; href: string }
  | { kind: "mock"; id: string; title: string; refId: string; estMin: number; href: string }
  | { kind: "mistakes"; id: string; title: string; estMin: number; href: string };

export interface PaceReport {
  /** 타입별 '오늘까지 끝냈어야 할 누적 신규' 대비 실제 학습 수 */
  byType: Record<CardContentType, { expected: number; learned: number; total: number }>;
  /** 양수면 뒤처짐(항목 수) */
  behind: number;
  mode: "ahead" | "on-track" | "behind" | "reduced";
}

export interface DayPlan {
  date: string;
  dday: number;
  week?: Week;
  tasks: Task[];
  totalMin: number;
  pace: PaceReport;
  /** 신규 학습 허용 여부 (11/25 이후, 9주차는 복습만) */
  newAllowed: boolean;
}

export interface PlanInput {
  today: string;
  examDate?: string;
  intensity?: Intensity;
  inventory: Record<CardContentType, InventoryItem[]>;
  /** 이미 카드가 생성된(학습 시작한) 콘텐츠 id */
  learned: Set<string>;
  dueCount: number;
  /** 보조 콘텐츠 id 목록 (주차 정보 포함) */
  readings?: { id: string; week: number }[];
  listenings?: { id: string; week: number }[];
  mocks?: { id: string }[];
  mistakeCount?: number;
  /** 오늘 이미 신규로 학습한 수 (할당량에서 차감) */
  newDoneToday?: Partial<Record<CardContentType, number>>;
}

const TYPE_TITLE: Record<CardContentType, string> = {
  kana: "가나 익히기",
  vocab: "새 어휘",
  kanji: "새 한자",
  grammar: "새 문법",
};
const NEW_MIN_PER_ITEM: Record<CardContentType, number> = { kana: 0.3, vocab: 0.6, kanji: 1, grammar: 2.5 };

function sortInventory(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => a.week - b.week || a.priority - b.priority);
}

/** "reading:w3-01" → "w3-01" (URL 세그먼트용) */
export function slugOf(id: string): string {
  return id.slice(id.indexOf(":") + 1);
}

/** 간단 결정적 해시 (날짜별 로테이션용) */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function computePace(
  today: string,
  inventory: Record<CardContentType, InventoryItem[]>,
  learned: Set<string>,
): PaceReport {
  const week = weekForDate(today);
  const byType = {} as PaceReport["byType"];
  let behind = 0;
  for (const t of CARD_TYPES) {
    const items = inventory[t] ?? [];
    let expected = 0;
    if (week) {
      const past = items.filter((i) => i.week < week.week).length;
      const cur = items.filter((i) => i.week === week.week);
      const weekLen = daysBetween(week.start, week.end) + 1;
      const elapsed = daysBetween(week.start, today) + 1; // 오늘 포함
      expected = past + Math.round((cur.length * Math.min(elapsed, weekLen)) / weekLen);
    } else if (today > CURRICULUM[CURRICULUM.length - 1].end) {
      expected = items.length;
    }
    const learnedCount = items.filter((i) => learned.has(i.id)).length;
    byType[t] = { expected, learned: learnedCount, total: items.length };
    behind += expected - learnedCount;
  }
  let mode: PaceReport["mode"] = "on-track";
  if (behind > 40) mode = "behind";
  else if (behind < -20) mode = "ahead";
  return { byType, behind, mode };
}

export function generateDayPlan(input: PlanInput): DayPlan {
  const examDate = input.examDate ?? EXAM_DATE_DEFAULT;
  const intensity = input.intensity ?? "normal";
  const factor = INTENSITY_FACTOR[intensity];
  const { today } = input;
  const week = weekForDate(today);
  const dday = daysBetween(today, examDate);
  const tasks: Task[] = [];
  const pace = computePace(today, input.inventory, input.learned);
  const newAllowed = !!week && !week.reviewOnly && today <= LAST_NEW_DAY && dday > 0;

  // 1) 복습은 항상 첫 번째
  if (input.dueCount > 0) {
    tasks.push({
      kind: "review",
      id: "review",
      title: "복습 (SRS)",
      count: input.dueCount,
      estMin: Math.max(1, Math.round(input.dueCount * 0.25)),
      href: "/review",
    });
  }

  // 2) 신규 학습: 타입별 할당량 + 뒤처짐 재분배
  if (week && newAllowed) {
    const daysLeftForNew = daysBetween(today, LAST_NEW_DAY) + 1;
    for (const t of CARD_TYPES) {
      const base = week.newPerDay[t];
      const candidates = sortInventory(input.inventory[t] ?? []).filter((i) => !input.learned.has(i.id));
      if (candidates.length === 0) continue;
      let quota = Math.round(base * factor);
      // 지난 주차에 끝냈어야 할 미학습(백로그)은 최대 14일에 걸쳐 재분배하되 할당량의 1.5배를 넘기지 않는다
      const backlog = candidates.filter((i) => i.week < week.week).length;
      if (backlog > 0) {
        const spreadDays = Math.max(1, Math.min(daysLeftForNew, 14));
        quota = Math.min(Math.max(Math.round(quota * 1.5), 5), quota + Math.ceil(backlog / spreadDays));
      }
      const done = input.newDoneToday?.[t] ?? 0;
      const remaining = Math.max(0, quota - done);
      if (remaining === 0) continue;
      const ids = candidates.slice(0, remaining).map((i) => i.id);
      if (ids.length === 0) continue;
      tasks.push({
        kind: "new",
        id: `new-${t}`,
        title: `${TYPE_TITLE[t]} ${ids.length}개`,
        type: t,
        ids,
        estMin: Math.max(1, Math.round(ids.length * NEW_MIN_PER_ITEM[t])),
        href: `/learn/${t}?mode=new`,
      });
    }
  }

  // 3) 퀴즈 1세트 (주차에 따라 모드 로테이션)
  if (week) {
    const modes: QuizMode[] = week.extras.includes("kana-quiz")
      ? ["kana", "vocab-meaning", "kana", "vocab-reading"]
      : ["vocab-meaning", "kanji-reading", "grammar-cloze", "vocab-reading", "kanji-meaning", "grammar-cloze"];
    const mode = modes[daysBetween(CURRICULUM[0].start, today) % modes.length];
    tasks.push({ kind: "quiz", id: "quiz", title: `퀴즈 · ${QUIZ_MODE_LABEL[mode]}`, mode, estMin: 5, href: `/quiz/${mode}` });
  }

  // 4) 보조 활동 (독해/청해/모의고사/오답)
  if (week) {
    const dayIdx = daysBetween(CURRICULUM[0].start, today);
    if (week.extras.includes("reading") && input.readings?.length) {
      const pool = input.readings.filter((r) => r.week <= week.week);
      if (pool.length) {
        const r = pool[(dayIdx + hash("r")) % pool.length];
        tasks.push({ kind: "reading", id: "reading", title: "독해 1편", refId: r.id, estMin: 10, href: `/reading/${slugOf(r.id)}` });
      }
    }
    if (week.extras.includes("listening") && input.listenings?.length) {
      const pool = input.listenings.filter((l) => l.week <= week.week);
      if (pool.length) {
        const l = pool[(dayIdx + hash("l")) % pool.length];
        tasks.push({ kind: "listening", id: "listening", title: "청해 1문제", refId: l.id, estMin: 8, href: `/listening/${slugOf(l.id)}` });
      }
    }
    if (week.extras.includes("mock") && input.mocks?.length) {
      // 모의고사 주간: 이틀에 한 번 (주 시작일, +2, +4)
      const offset = daysBetween(week.start, today);
      if (offset % 2 === 0) {
        const m = input.mocks[Math.min(input.mocks.length - 1, Math.floor(offset / 2))];
        tasks.push({ kind: "mock", id: "mock", title: "모의고사", refId: m.id, estMin: 70, href: `/mock/${slugOf(m.id)}` });
      }
    }
    if (week.extras.includes("mistakes") && (input.mistakeCount ?? 0) > 0) {
      tasks.push({ kind: "mistakes", id: "mistakes", title: `오답노트 ${input.mistakeCount}개 재확인`, estMin: 8, href: "/mistakes" });
    }
  }

  const totalMin = tasks.reduce((s, t) => s + t.estMin, 0);
  return { date: today, dday, week, tasks, totalMin, pace, newAllowed };
}

export const QUIZ_MODE_LABEL: Record<QuizMode, string> = {
  kana: "가나 읽기",
  "vocab-meaning": "어휘 → 뜻",
  "vocab-reading": "어휘 읽기",
  "kanji-reading": "한자 읽기",
  "kanji-meaning": "한자 뜻",
  "grammar-cloze": "문법 빈칸",
  listening: "청해",
};

/** 전체 로드맵용: 주차별 신규 총량(현재 인벤토리 기준) */
export function weekSummary(inventory: Record<CardContentType, InventoryItem[]>) {
  return CURRICULUM.map((w) => ({
    week: w,
    counts: Object.fromEntries(
      CARD_TYPES.map((t) => [t, (inventory[t] ?? []).filter((i) => i.week === w.week).length]),
    ) as Record<CardContentType, number>,
  }));
}
