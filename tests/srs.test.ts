import { describe, expect, it } from "vitest";
import { buildQueue, capInterval, isDue, masteryOf, newCard, previewIntervals, schedule, type Card, type CardState } from "@/lib/srs";

const EXAM = "2026-12-06";
// 2026-10-08 12:00 로컬
const NOW = new Date(2026, 9, 8, 12, 0, 0).getTime();
const opts = { now: NOW, examDate: EXAM };
const MIN = 60_000;
const DAY = 86_400_000;

describe("schedule", () => {
  it("신규 카드에 '알맞음' → 10분 뒤 learning", () => {
    const c = schedule(newCard("vocab:x", "vocab", NOW), 2, opts);
    expect(c.state).toBe("learning");
    expect(c.due - NOW).toBe(10 * MIN);
    expect(c.reps).toBe(1);
  });

  it("learning 단계를 거쳐 졸업하면 review 3일", () => {
    let c = schedule(newCard("vocab:x", "vocab", NOW), 2, opts); // step0
    c = schedule(c, 2, { ...opts, now: c.due }); // step1 → 내일
    expect(c.state).toBe("learning");
    expect(c.step).toBe(1);
    c = schedule(c, 2, { ...opts, now: c.due }); // 졸업
    expect(c.state).toBe("review");
    expect(c.interval).toBe(3);
  });

  it("신규에 '쉬움' → 바로 review 5일, ease 상승", () => {
    const c = schedule(newCard("vocab:x", "vocab", NOW), 3, opts);
    expect(c.state).toBe("review");
    expect(c.interval).toBe(5);
    expect(c.ease).toBeCloseTo(2.65);
  });

  it("review 에서 '다시' → relearning, lapses+1, ease-0.2, 간격 축소", () => {
    const base = { ...newCard("vocab:x", "vocab", NOW), state: "review" as const, interval: 10, ease: 2.5 };
    const c = schedule(base, 0, opts);
    expect(c.state).toBe("relearning");
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeCloseTo(2.3);
    expect(c.interval).toBe(3);
    expect(c.due - NOW).toBe(10 * MIN);
    const back = schedule(c, 2, { ...opts, now: c.due });
    expect(back.state).toBe("review");
    expect(back.interval).toBe(3);
  });

  it("review '알맞음' 은 interval × ease, '어려움' 은 ×1.2 + ease 감소", () => {
    const base = { ...newCard("vocab:x", "vocab", NOW), state: "review" as const, interval: 4, ease: 2.5 };
    expect(schedule(base, 2, opts).interval).toBe(10);
    const hard = schedule(base, 1, opts);
    expect(hard.interval).toBe(5);
    expect(hard.ease).toBeCloseTo(2.35);
  });

  it("ease 는 1.3 아래로 내려가지 않는다", () => {
    let c: Card = { ...newCard("vocab:x", "vocab", NOW), state: "review", interval: 4, ease: 1.4 };
    c = schedule(c, 0, opts);
    expect(c.ease).toBe(1.3);
  });

  it("시험 전날을 넘는 간격은 캡된다", () => {
    const nearExam = new Date(2026, 11, 1, 12).getTime(); // 12/01, 시험까지 5일
    const base = { ...newCard("vocab:x", "vocab", nearExam), state: "review" as const, interval: 20, ease: 2.5 };
    const c = schedule(base, 3, { now: nearExam, examDate: EXAM });
    expect(c.interval).toBe(4);
    expect(capInterval(100, NOW, EXAM)).toBe(45);
    expect(capInterval(100, nearExam, EXAM)).toBe(4);
  });

  it("isDue / mastery", () => {
    const c = newCard("vocab:x", "vocab", NOW);
    expect(isDue(c, NOW)).toBe(true);
    expect(isDue({ ...c, due: NOW + DAY }, NOW)).toBe(false);
    expect(masteryOf(undefined)).toBe("unseen");
    expect(masteryOf(c)).toBe("learning");
    expect(masteryOf({ ...c, state: "review", interval: 3 })).toBe("young");
    expect(masteryOf({ ...c, state: "review", interval: 7 })).toBe("mature");
  });

  it("previewIntervals 라벨", () => {
    const p = previewIntervals(newCard("vocab:x", "vocab", NOW), opts);
    expect(p[0]).toBe("10분");
    expect(p[2]).toBe("10분");
    expect(p[3]).toMatch(/일$/);
  });
});

describe("buildQueue", () => {
  it("만기 3 : 신규 1 로 섞고 limit 를 지킨다", () => {
    type Q = { id: string; due: number; state: CardState };
    const due: Q[] = Array.from({ length: 6 }, (_, i) => ({ id: `d${i}`, due: NOW - i * MIN, state: "review" }));
    const fresh: Q[] = Array.from({ length: 3 }, (_, i) => ({ id: `n${i}`, due: NOW, state: "new" }));
    const q = buildQueue(due, fresh, 7);
    expect(q).toHaveLength(7);
    expect(q[0].id).toBe("d5"); // 가장 오래된 만기 먼저
    expect(q[3].id).toBe("n0");
    expect(q.filter((c) => c.state === "new")).toHaveLength(1);
  });
});
