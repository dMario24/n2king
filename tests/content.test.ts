import { describe, expect, it } from "vitest";
import { KANA } from "@/data/kana";
import { VOCAB } from "@/data/vocab";
import { KANJI } from "@/data/kanji";
import { GRAMMAR } from "@/data/grammar";
import { READING } from "@/data/reading";
import { LISTENING } from "@/data/listening";
import { MOCK } from "@/data/mock";
import { CURRICULUM } from "@/data/curriculum";
import type { MCQuestion } from "@/lib/content/types";

function expectUnique(ids: string[], label: string) {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }
  expect(dup, `${label} 중복 id`).toEqual([]);
}

function checkQuestions(qs: MCQuestion[], label: string) {
  for (const q of qs) {
    expect(q.choices.length, `${label}/${q.id} 선택지 수`).toBeGreaterThanOrEqual(2);
    expect(q.answer, `${label}/${q.id} 정답 index`).toBeGreaterThanOrEqual(0);
    expect(q.answer, `${label}/${q.id} 정답 index`).toBeLessThan(q.choices.length);
    expect(new Set(q.choices).size, `${label}/${q.id} 선택지 중복`).toBe(q.choices.length);
    expect(q.prompt.trim().length, `${label}/${q.id} 문제 비어있음`).toBeGreaterThan(0);
  }
}

describe("가나", () => {
  it("기본 46 + 탁음/반탁음 25 + 요음 33 (히라가나·가타카나 각각)", () => {
    const hira = KANA.filter((k) => k.script === "hiragana");
    const kata = KANA.filter((k) => k.script === "katakana");
    expect(hira.filter((k) => k.group === "basic")).toHaveLength(46);
    expect(hira.filter((k) => k.group === "dakuten" || k.group === "handakuten")).toHaveLength(25);
    expect(hira.filter((k) => k.group === "youon")).toHaveLength(33);
    expect(kata).toHaveLength(hira.length);
    expectUnique(KANA.map((k) => k.id), "kana");
  });
});

describe("전체 id 유일성", () => {
  it("모든 콘텐츠 id 가 전역 유일하고 타입 접두사를 가진다", () => {
    const all = [
      ...KANA.map((x) => x.id),
      ...VOCAB.map((x) => x.id),
      ...KANJI.map((x) => x.id),
      ...GRAMMAR.map((x) => x.id),
      ...READING.map((x) => x.id),
      ...LISTENING.map((x) => x.id),
      ...MOCK.map((x) => x.id),
    ];
    expectUnique(all, "all");
    for (const v of VOCAB) expect(v.id).toMatch(/^vocab:/);
    for (const k of KANJI) expect(k.id).toMatch(/^kanji:/);
    for (const g of GRAMMAR) expect(g.id).toMatch(/^grammar:/);
    for (const r of READING) expect(r.id).toMatch(/^reading:/);
    for (const l of LISTENING) expect(l.id).toMatch(/^listening:/);
    for (const m of MOCK) expect(m.id).toMatch(/^mock:/);
  });
});

describe("어휘", () => {
  it("필수 필드와 주차 범위", () => {
    for (const v of VOCAB) {
      expect(v.word.length, v.id).toBeGreaterThan(0);
      expect(v.reading.length, v.id).toBeGreaterThan(0);
      expect(v.meanings.length, v.id).toBeGreaterThan(0);
      expect(v.week, v.id).toBeGreaterThanOrEqual(1);
      expect(v.week, v.id).toBeLessThanOrEqual(9);
      expect(/^[ぁ-ゖー・\s]+$/.test(v.reading), `${v.id} 읽기는 히라가나: ${v.reading}`).toBe(true);
    }
  });
});

describe("한자", () => {
  it("한 글자, 대표 단어 1개 이상, 음독은 가타카나·훈독은 히라가나", () => {
    for (const k of KANJI) {
      expect([...k.char], k.id).toHaveLength(1);
      expect(k.id).toBe(`kanji:${k.char}`);
      expect(k.words.length, k.id).toBeGreaterThan(0);
      expect(k.on.length + k.kun.length, k.id).toBeGreaterThan(0);
      for (const o of k.on) expect(/^[ァ-ヺー]+$/.test(o), `${k.id} 음독 ${o}`).toBe(true);
      for (const u of k.kun) expect(/^[ぁ-ゖー.]+$/.test(u), `${k.id} 훈독 ${u}`).toBe(true);
    }
  });
});

describe("문법", () => {
  it("예문 1개 이상, 빈칸 문제 형식", () => {
    for (const g of GRAMMAR) {
      expect(g.examples.length, g.id).toBeGreaterThan(0);
      expect(g.pattern.length, g.id).toBeGreaterThan(0);
      for (const c of g.cloze ?? []) {
        expect(c.sentence.includes("___"), `${g.id} 빈칸 ___ 없음`).toBe(true);
        expect(c.distractors.includes(c.answer), `${g.id} 오답에 정답 포함`).toBe(false);
        expect(c.distractors.length, g.id).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("독해/청해/모의고사", () => {
  it("문항 무결성", () => {
    for (const r of READING) checkQuestions(r.questions, r.id);
    for (const l of LISTENING) {
      expect(l.lines.length, l.id).toBeGreaterThan(0);
      checkQuestions(l.questions, l.id);
    }
    for (const m of MOCK) {
      for (const s of m.sections) {
        checkQuestions(s.questions, `${m.id}/${s.kind}`);
        if (s.scripts) expect(s.scripts, `${m.id}/${s.kind} scripts 길이`).toHaveLength(s.questions.length);
      }
      expectUnique(m.sections.flatMap((s) => s.questions.map((q) => q.id)), m.id);
    }
  });
});

describe("커리큘럼", () => {
  it("1~9주가 빈틈없이 이어지고 시험일에 끝난다", () => {
    expect(CURRICULUM[0].start).toBe("2026-10-08");
    expect(CURRICULUM.at(-1)!.end).toBe("2026-12-06");
    for (let i = 1; i < CURRICULUM.length; i++) {
      const prevEnd = new Date(CURRICULUM[i - 1].end);
      prevEnd.setDate(prevEnd.getDate() + 1);
      expect(CURRICULUM[i].start).toBe(prevEnd.toISOString().slice(0, 10));
      expect(CURRICULUM[i].week).toBe(i + 1);
    }
  });
});
