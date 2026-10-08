/**
 * IndexedDB 저장소 (Dexie). 로그인/서버 없이 브라우저에만 저장하며,
 * 기기 간 이동은 JSON 내보내기/가져오기로 한다.
 * 이 모듈은 클라이언트 컴포넌트에서만 import 한다.
 */
import Dexie, { type EntityTable } from "dexie";
import type { Card, Grade } from "./srs";
import { newCard, schedule } from "./srs";
import type { CardContentType } from "./content/types";
import { EXAM_DATE_DEFAULT, START_DATE_DEFAULT, todayStr } from "./date";
import type { Intensity } from "./plan";

export interface ReviewLog {
  id?: number;
  cardId: string;
  ts: number;
  grade: Grade;
  /** 카드를 보고 평가하기까지 걸린 시간(ms) */
  elapsedMs?: number;
}

export interface Mistake {
  /** 문항 id 또는 `${contentId}#${mode}` */
  id: string;
  contentId?: string;
  source: "quiz" | "review" | "reading" | "listening" | "mock";
  prompt: string;
  correct: string;
  chosen?: string;
  explanation?: string;
  count: number;
  firstTs: number;
  lastTs: number;
  resolvedAt?: number;
}

export interface Daily {
  date: string; // YYYY-MM-DD
  reviews: number;
  newByType: Partial<Record<CardContentType, number>>;
  quizCorrect: number;
  quizTotal: number;
  minutes: number;
  tasksDone: string[];
}

export interface MockResult {
  id?: number;
  mockId: string;
  ts: number;
  /** 섹션별 정답/문항 수 */
  sections: { kind: string; correct: number; total: number }[];
  correct: number;
  total: number;
}

export interface Settings {
  examDate: string;
  startDate: string;
  intensity: Intensity;
  /** 모바일 '짧은 복습' 카드 수 */
  quickBatch: number;
  ttsRate: number;
  ttsVoice?: string;
  onboardingDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  examDate: EXAM_DATE_DEFAULT,
  startDate: START_DATE_DEFAULT,
  intensity: "normal",
  quickBatch: 10,
  ttsRate: 1,
  onboardingDone: false,
};

interface SettingRow<K extends keyof Settings = keyof Settings> {
  key: K;
  value: Settings[K];
}

export class N2Db extends Dexie {
  cards!: EntityTable<Card, "id">;
  reviews!: EntityTable<ReviewLog, "id">;
  mistakes!: EntityTable<Mistake, "id">;
  daily!: EntityTable<Daily, "date">;
  settings!: EntityTable<SettingRow, "key">;
  mockResults!: EntityTable<MockResult, "id">;

  constructor() {
    super("n2king");
    this.version(1).stores({
      cards: "id, type, state, due, [type+state]",
      reviews: "++id, cardId, ts",
      mistakes: "id, lastTs, resolvedAt, contentId, source",
      daily: "date",
      settings: "key",
    });
    this.version(2).stores({
      mockResults: "++id, mockId, ts",
    });
  }
}

let _db: N2Db | undefined;
export function getDb(): N2Db {
  if (!_db) _db = new N2Db();
  return _db;
}

/* ───────────── 설정 ───────────── */

export async function getSettings(): Promise<Settings> {
  const rows = await getDb().settings.toArray();
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) (s as unknown as Record<string, unknown>)[r.key] = r.value;
  return s;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await getDb().settings.put({ key, value } as SettingRow);
}

/* ───────────── 일일 통계 ───────────── */

function emptyDaily(date: string): Daily {
  return { date, reviews: 0, newByType: {}, quizCorrect: 0, quizTotal: 0, minutes: 0, tasksDone: [] };
}

export async function updateDaily(date: string, fn: (d: Daily) => void) {
  const db = getDb();
  await db.transaction("rw", db.daily, async () => {
    const d = (await db.daily.get(date)) ?? emptyDaily(date);
    fn(d);
    await db.daily.put(d);
  });
}

export async function markTaskDone(date: string, taskId: string, done = true) {
  await updateDaily(date, (d) => {
    const set = new Set(d.tasksDone);
    if (done) set.add(taskId);
    else set.delete(taskId);
    d.tasksDone = [...set];
  });
}

export async function addMinutes(date: string, minutes: number) {
  await updateDaily(date, (d) => {
    d.minutes += minutes;
  });
}

export async function recordQuiz(date: string, correct: number, total: number) {
  await updateDaily(date, (d) => {
    d.quizCorrect += correct;
    d.quizTotal += total;
  });
}

/* ───────────── 카드 ───────────── */

/** 콘텐츠를 학습 시작(카드 생성). 이미 있는 카드는 건드리지 않는다. */
export async function introduceCards(ids: string[], type: CardContentType, now = Date.now()) {
  const db = getDb();
  const existing = new Set((await db.cards.bulkGet(ids)).filter(Boolean).map((c) => c!.id));
  const fresh = ids.filter((id) => !existing.has(id)).map((id) => newCard(id, type, now));
  if (fresh.length === 0) return 0;
  await db.cards.bulkPut(fresh);
  await updateDaily(todayStr(new Date(now)), (d) => {
    d.newByType[type] = (d.newByType[type] ?? 0) + fresh.length;
  });
  return fresh.length;
}

export async function recordReview(card: Card, grade: Grade, examDate: string, now = Date.now(), elapsedMs?: number) {
  const db = getDb();
  const next = schedule(card, grade, { now, examDate });
  await db.transaction("rw", db.cards, db.reviews, db.daily, async () => {
    await db.cards.put(next);
    await db.reviews.add({ cardId: card.id, ts: now, grade, elapsedMs });
    const date = todayStr(new Date(now));
    const d = (await db.daily.get(date)) ?? emptyDaily(date);
    d.reviews += 1;
    await db.daily.put(d);
  });
  return next;
}

/** 되돌리기: 이전 카드 상태로 복원하고 마지막 로그를 지운다 */
export async function undoReview(prev: Card) {
  const db = getDb();
  await db.transaction("rw", db.cards, db.reviews, db.daily, async () => {
    await db.cards.put(prev);
    const last = await db.reviews.where("cardId").equals(prev.id).reverse().sortBy("ts");
    if (last[0]?.id != null) {
      await db.reviews.delete(last[0].id);
      const date = todayStr(new Date(last[0].ts));
      const d = await db.daily.get(date);
      if (d) {
        d.reviews = Math.max(0, d.reviews - 1);
        await db.daily.put(d);
      }
    }
  });
}

export async function setSuspended(id: string, suspended: boolean) {
  await getDb().cards.update(id, { suspended, updatedAt: Date.now() });
}

/* ───────────── 오답노트 ───────────── */

export async function logMistake(m: Omit<Mistake, "count" | "firstTs" | "lastTs"> & { ts?: number }) {
  const db = getDb();
  const ts = m.ts ?? Date.now();
  const prev = await db.mistakes.get(m.id);
  await db.mistakes.put({
    ...m,
    count: (prev?.count ?? 0) + 1,
    firstTs: prev?.firstTs ?? ts,
    lastTs: ts,
    resolvedAt: undefined,
  });
}

export async function resolveMistake(id: string, resolved = true) {
  await getDb().mistakes.update(id, { resolvedAt: resolved ? Date.now() : undefined });
}

/* ───────────── 내보내기 / 가져오기 ───────────── */

export interface ExportBundle {
  app: "n2king";
  version: 1 | 2;
  exportedAt: string;
  cards: Card[];
  reviews: ReviewLog[];
  mistakes: Mistake[];
  daily: Daily[];
  settings: SettingRow[];
  mockResults?: MockResult[];
}

export async function exportAll(): Promise<ExportBundle> {
  const db = getDb();
  const [cards, reviews, mistakes, daily, settings, mockResults] = await Promise.all([
    db.cards.toArray(),
    db.reviews.toArray(),
    db.mistakes.toArray(),
    db.daily.toArray(),
    db.settings.toArray(),
    db.mockResults.toArray(),
  ]);
  return { app: "n2king", version: 2, exportedAt: new Date().toISOString(), cards, reviews, mistakes, daily, settings, mockResults };
}

export function validateBundle(x: unknown): x is ExportBundle {
  if (!x || typeof x !== "object") return false;
  const b = x as Partial<ExportBundle>;
  return b.app === "n2king" && (b.version === 1 || b.version === 2) && Array.isArray(b.cards) && Array.isArray(b.daily);
}

/** 가져오기: 기존 데이터를 모두 지우고 번들로 교체 */
export async function importAll(bundle: ExportBundle) {
  const db = getDb();
  await db.transaction("rw", [db.cards, db.reviews, db.mistakes, db.daily, db.settings, db.mockResults], async () => {
    await Promise.all([db.cards.clear(), db.reviews.clear(), db.mistakes.clear(), db.daily.clear(), db.settings.clear(), db.mockResults.clear()]);
    await db.cards.bulkPut(bundle.cards);
    await db.mockResults.bulkAdd((bundle.mockResults ?? []).map((r) => ({ mockId: r.mockId, ts: r.ts, sections: r.sections, correct: r.correct, total: r.total })));
    await db.reviews.bulkAdd((bundle.reviews ?? []).map((r) => ({ cardId: r.cardId, ts: r.ts, grade: r.grade, elapsedMs: r.elapsedMs })));
    await db.mistakes.bulkPut(bundle.mistakes ?? []);
    await db.daily.bulkPut(bundle.daily);
    await db.settings.bulkPut(bundle.settings ?? []);
  });
}

export async function resetAll() {
  const db = getDb();
  await db.transaction("rw", [db.cards, db.reviews, db.mistakes, db.daily, db.settings, db.mockResults], async () => {
    await Promise.all([db.cards.clear(), db.reviews.clear(), db.mistakes.clear(), db.daily.clear(), db.settings.clear(), db.mockResults.clear()]);
  });
}

export async function saveMockResult(r: Omit<MockResult, "id">) {
  await getDb().mockResults.add(r);
}
