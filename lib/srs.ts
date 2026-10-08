/**
 * 간격 반복(SRS) 엔진: SM-2 변형 + Anki 식 학습 단계 + 시험일 캡.
 * 순수 함수로만 구성되어 tests/srs.test.ts 에서 결정적으로 검증한다.
 *
 * 상태 전이
 *  new ──(첫 평가)──▶ learning(step 0..n) ──(졸업)──▶ review
 *  review ──(again)──▶ relearning ──(good)──▶ review
 */
import type { CardContentType } from "./content/types";
import { daysBetween, toDateStr } from "./date";

/** 0 다시 / 1 어려움 / 2 알맞음 / 3 쉬움 */
export type Grade = 0 | 1 | 2 | 3;
export type CardState = "new" | "learning" | "review" | "relearning";

export interface Card {
  /** 콘텐츠 id 와 동일 (vocab:b1-001) */
  id: string;
  type: CardContentType;
  state: CardState;
  /** 학습 단계 index (learning/relearning 에서만 의미) */
  step: number;
  /** 난이도 계수. 2.5 시작, [1.3, 3.0] */
  ease: number;
  /** 복습 간격(일). review 상태에서 의미. relearning 중에는 복귀 시 사용할 간격을 보관 */
  interval: number;
  /** 다음 복습 시각 (epoch ms) */
  due: number;
  reps: number;
  lapses: number;
  lastReview?: number;
  createdAt: number;
  updatedAt: number;
  suspended?: boolean;
}

export const GRADE_LABEL: Record<Grade, string> = { 0: "다시", 1: "어려움", 2: "알맞음", 3: "쉬움" };

const MIN = 60_000;
const DAY = 86_400_000;
/** 학습 단계: 10분 → 1일 */
const LEARNING_STEPS_MIN = [10, 24 * 60];
const RELEARNING_STEPS_MIN = [10];
const GRADUATING_INTERVAL = 3;
const EASY_INTERVAL = 5;
const MAX_INTERVAL = 45;
const EASE_MIN = 1.3;
const EASE_MAX = 3.0;

export interface ScheduleOptions {
  now: number;
  /** YYYY-MM-DD. 다음 복습이 이 날짜 이전에 오도록 간격을 캡한다 */
  examDate: string;
}

export function newCard(id: string, type: CardContentType, now: number): Card {
  return {
    id,
    type,
    state: "new",
    step: 0,
    ease: 2.5,
    interval: 0,
    due: now,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function clampEase(e: number) {
  return Math.min(EASE_MAX, Math.max(EASE_MIN, Math.round(e * 100) / 100));
}

/** 로컬 자정 기준으로 n일 뒤 04:00 (하루 경계가 새벽에 바뀌어 밤늦게 공부해도 '오늘'로 취급) */
function dueInDays(now: number, days: number): number {
  const d = new Date(now);
  d.setHours(4, 0, 0, 0);
  if (now < d.getTime()) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** 시험 전날까지만 복습이 잡히도록 간격(일)을 캡 */
export function capInterval(days: number, now: number, examDate: string): number {
  const today = toDateStr(new Date(now));
  const toExam = daysBetween(today, examDate);
  const cap = Math.max(1, Math.min(MAX_INTERVAL, toExam - 1));
  return Math.max(1, Math.min(Math.round(days), cap));
}

export function schedule(card: Card, grade: Grade, opts: ScheduleOptions): Card {
  const { now, examDate } = opts;
  const next: Card = { ...card, reps: card.reps + 1, lastReview: now, updatedAt: now };

  if (card.state === "new" || card.state === "learning") {
    const steps = LEARNING_STEPS_MIN;
    if (grade === 0) {
      next.state = "learning";
      next.step = 0;
      next.due = now + steps[0] * MIN;
    } else if (grade === 1) {
      next.state = "learning";
      next.step = Math.min(card.step, steps.length - 1);
      next.due = now + Math.round(steps[next.step] * 1.5) * MIN;
    } else if (grade === 2) {
      const s = card.state === "new" ? 0 : card.step + 1;
      if (s >= steps.length) {
        graduate(next, GRADUATING_INTERVAL, now, examDate);
      } else {
        next.state = "learning";
        next.step = s;
        next.due = s === 0 ? now + steps[0] * MIN : dueInDays(now, 1);
      }
    } else {
      graduate(next, EASY_INTERVAL, now, examDate);
      next.ease = clampEase(card.ease + 0.15);
    }
    return next;
  }

  if (card.state === "relearning") {
    if (grade === 0) {
      next.step = 0;
      next.due = now + RELEARNING_STEPS_MIN[0] * MIN;
    } else if (grade === 1) {
      next.due = now + Math.round(RELEARNING_STEPS_MIN[0] * 1.5) * MIN;
    } else {
      graduate(next, Math.max(1, card.interval), now, examDate);
    }
    return next;
  }

  // review
  if (grade === 0) {
    next.state = "relearning";
    next.step = 0;
    next.lapses = card.lapses + 1;
    next.ease = clampEase(card.ease - 0.2);
    next.interval = Math.max(1, Math.round(card.interval * 0.3));
    next.due = now + RELEARNING_STEPS_MIN[0] * MIN;
    return next;
  }
  let interval: number;
  if (grade === 1) {
    interval = Math.max(card.interval + 1, card.interval * 1.2);
    next.ease = clampEase(card.ease - 0.15);
  } else if (grade === 2) {
    interval = Math.max(card.interval + 1, card.interval * card.ease);
  } else {
    interval = Math.max(card.interval + 2, card.interval * card.ease * 1.3);
    next.ease = clampEase(card.ease + 0.15);
  }
  graduate(next, interval, now, examDate);
  return next;
}

function graduate(card: Card, intervalDays: number, now: number, examDate: string) {
  card.state = "review";
  card.step = 0;
  card.interval = capInterval(intervalDays, now, examDate);
  card.due = dueInDays(now, card.interval);
}

export function isDue(card: Card, now: number): boolean {
  return !card.suspended && card.due <= now;
}

/** 평가 버튼에 표시할 다음 간격 미리보기 ("10분", "1일", "3일") */
export function previewIntervals(card: Card, opts: ScheduleOptions): Record<Grade, string> {
  const out = {} as Record<Grade, string>;
  for (const g of [0, 1, 2, 3] as Grade[]) {
    const n = schedule(card, g, opts);
    out[g] = formatDelta(n.due - opts.now);
  }
  return out;
}

export function formatDelta(ms: number): string {
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}분`;
  if (ms < 36 * 60 * MIN) return `${Math.max(1, Math.round(ms / (60 * MIN)))}시간`;
  return `${Math.max(1, Math.round(ms / DAY))}일`;
}

export type Mastery = "unseen" | "learning" | "young" | "mature";

export function masteryOf(card: Card | undefined): Mastery {
  if (!card) return "unseen";
  if (card.state === "review" && card.interval >= 7) return "mature";
  if (card.state === "review") return "young";
  return "learning";
}

export const MASTERY_LABEL: Record<Mastery, string> = {
  unseen: "미학습",
  learning: "학습 중",
  young: "익히는 중",
  mature: "정착",
};

/**
 * 세션 큐 구성: 만기 카드(오래된 순) 우선, 신규 카드는 3:1 비율로 섞는다.
 */
export function buildQueue<T extends { due: number; state: CardState }>(
  due: T[],
  fresh: T[],
  limit: number,
): T[] {
  const sortedDue = [...due].sort((a, b) => a.due - b.due);
  const out: T[] = [];
  let di = 0;
  let ni = 0;
  while (out.length < limit && (di < sortedDue.length || ni < fresh.length)) {
    for (let k = 0; k < 3 && di < sortedDue.length && out.length < limit; k++) out.push(sortedDue[di++]);
    if (ni < fresh.length && out.length < limit) out.push(fresh[ni++]);
  }
  return out;
}
