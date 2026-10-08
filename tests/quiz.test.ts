import { describe, expect, it } from "vitest";
import { buildQuiz, mulberry32, type Pools } from "@/lib/quiz";
import { KANA } from "@/data/kana";
import type { GrammarEntry, KanjiEntry, VocabEntry } from "@/lib/content/types";

const vocab: VocabEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `vocab:t-${i}`,
  word: `単語${i}`,
  reading: `たんご${"あいうえおかきくけこさし"[i]}`,
  meanings: [`뜻${i}`],
  pos: i % 2 ? "名" : "動1",
  level: "N5",
  week: (i % 3) + 1,
  priority: 1,
  examples: [{ ja: `例文${i}です。`, ko: `예문${i}입니다.` }],
}));
const kanji: KanjiEntry[] = Array.from({ length: 8 }, (_, i) => ({
  id: `kanji:${"日月火水木金土山"[i]}`,
  char: "日月火水木金土山"[i],
  meanings: [`훈음${i}`],
  on: ["ニチ"],
  kun: ["ひ"],
  level: "N5",
  week: 1,
  priority: 1,
  words: [{ word: `単${i}`, reading: `よみ${"あいうえおかきく"[i]}`, meaning: `뜻${i}` }],
}));
const grammar: GrammarEntry[] = Array.from({ length: 6 }, (_, i) => ({
  id: `grammar:t-${i}`,
  pattern: `〜ぱたん${i}`,
  meaning: `문법뜻${i}`,
  connection: "普通形",
  explanation: "설명",
  level: "N2",
  week: 4,
  priority: 1,
  examples: [{ ja: `文${i}。`, ko: `문장${i}.` }],
  cloze: [{ sentence: `これは___です${i}。`, answer: `ぱたん${i}`, distractors: ["ぱたんX", "ぱたんY", "ぱたんZ"] }],
}));
const pools: Pools = { kana: KANA, vocab, kanji, grammar };

function checkAll(qs: ReturnType<typeof buildQuiz>) {
  for (const q of qs) {
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices).size).toBe(4);
    expect(q.choices[q.answer]).toBeDefined();
    expect(q.prompt.length).toBeGreaterThan(0);
  }
}

describe("buildQuiz", () => {
  const rng = mulberry32(42);
  it("가나: 같은 행/그룹 오답 우선", () => {
    const qs = buildQuiz({ mode: "kana", count: 10, pools, rng });
    expect(qs).toHaveLength(10);
    checkAll(qs);
    expect(qs.every((q) => !q.choicesJa)).toBe(true);
  });
  it("어휘 뜻/읽기, 한자 읽기/뜻, 문법 빈칸, 청해", () => {
    for (const mode of ["vocab-meaning", "vocab-reading", "kanji-reading", "kanji-meaning", "grammar-cloze", "listening"] as const) {
      const qs = buildQuiz({ mode, count: 5, pools, rng: mulberry32(7) });
      expect(qs.length, mode).toBeGreaterThan(0);
      checkAll(qs);
    }
  });
  it("정답은 해당 항목의 값이고 중복 출제가 없다", () => {
    const qs = buildQuiz({ mode: "vocab-meaning", count: 12, pools, rng: mulberry32(1) });
    expect(new Set(qs.map((q) => q.refId)).size).toBe(qs.length);
    for (const q of qs) {
      const v = vocab.find((x) => x.id === q.refId)!;
      expect(q.choices[q.answer]).toBe(v.meanings[0]);
    }
  });
  it("preferIds 가 먼저 출제되고 maxWeek 로 나머지를 제한한다", () => {
    const prefer = new Set(["vocab:t-5", "vocab:t-7"]);
    const qs = buildQuiz({ mode: "vocab-meaning", count: 4, pools, preferIds: prefer, maxWeek: 1, rng: mulberry32(3) });
    expect(qs.slice(0, 2).map((q) => q.refId).sort()).toEqual(["vocab:t-5", "vocab:t-7"]);
    for (const q of qs.slice(2)) expect(vocab.find((v) => v.id === q.refId)!.week).toBe(1);
  });
  it("오답 재시험 모드는 타입별 적절한 문제를 만든다", () => {
    const qs = buildQuiz({ mode: "mistakes", count: 10, pools, preferIds: new Set(["vocab:t-1", "kanji:日", "grammar:t-2", "kana:hi-a"]), rng: mulberry32(9) });
    expect(qs).toHaveLength(4);
    checkAll(qs);
    expect(qs.every((q) => q.mode === "mistakes")).toBe(true);
  });
  it("결정적: 같은 시드면 같은 결과", () => {
    const a = buildQuiz({ mode: "kana", count: 5, pools, rng: mulberry32(5) });
    const b = buildQuiz({ mode: "kana", count: 5, pools, rng: mulberry32(5) });
    expect(a).toEqual(b);
  });
});
