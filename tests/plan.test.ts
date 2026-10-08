import { describe, expect, it } from "vitest";
import { computePace, generateDayPlan, type InventoryItem } from "@/lib/plan";
import type { CardContentType } from "@/lib/content/types";

function inv(type: string, week: number, n: number, offset = 0): InventoryItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${type}:w${week}-${i + offset}`, week, priority: 1 }));
}

const inventory: Record<CardContentType, InventoryItem[]> = {
  kana: inv("kana", 1, 208),
  vocab: [...inv("vocab", 1, 150), ...inv("vocab", 2, 250), ...inv("vocab", 4, 300)],
  kanji: [...inv("kanji", 1, 35), ...inv("kanji", 2, 85)],
  grammar: [...inv("grammar", 1, 14), ...inv("grammar", 2, 28)],
};

describe("generateDayPlan", () => {
  it("1주차 첫날: 복습 없음, 가나/어휘 신규, 가나 퀴즈", () => {
    const p = generateDayPlan({ today: "2026-10-08", inventory, learned: new Set(), dueCount: 0 });
    expect(p.dday).toBe(59);
    expect(p.week?.week).toBe(1);
    expect(p.tasks.find((t) => t.kind === "review")).toBeUndefined();
    const kana = p.tasks.find((t) => t.kind === "new" && t.type === "kana");
    expect(kana && kana.kind === "new" && kana.ids.length).toBe(40);
    const vocab = p.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    expect(vocab && vocab.kind === "new" && vocab.ids.length).toBe(20);
    expect(p.tasks.find((t) => t.kind === "quiz")).toMatchObject({ mode: "kana" });
  });

  it("만기 카드가 있으면 복습이 첫 번째 태스크", () => {
    const p = generateDayPlan({ today: "2026-10-20", inventory, learned: new Set(), dueCount: 37 });
    expect(p.tasks[0]).toMatchObject({ kind: "review", count: 37 });
  });

  it("강도 설정이 신규 할당량을 조정한다", () => {
    const light = generateDayPlan({ today: "2026-10-16", inventory, learned: new Set(), dueCount: 0, intensity: "light" });
    const hard = generateDayPlan({ today: "2026-10-16", inventory, learned: new Set(), dueCount: 0, intensity: "hard" });
    const lv = light.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    const hv = hard.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    expect(lv?.kind === "new" && lv.ids.length).toBeLessThan(hv?.kind === "new" ? hv.ids.length : 0);
  });

  it("뒤처지면(밀린 항목) 할당량이 최대 1.5배까지 늘어난다", () => {
    // 2주차 마지막 날인데 1~2주차 어휘를 하나도 안 했다
    const p = generateDayPlan({ today: "2026-10-21", inventory, learned: new Set(), dueCount: 0 });
    const v = p.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    expect(v?.kind === "new" && v.ids.length).toBeGreaterThan(35);
    expect(p.pace.mode).toBe("behind");
    expect(p.pace.behind).toBeGreaterThan(0);
  });

  it("이미 학습한 항목은 제외하고 주차 순으로 고른다", () => {
    const learned = new Set(inventory.vocab.slice(0, 150).map((i) => i.id));
    const p = generateDayPlan({ today: "2026-10-15", inventory, learned, dueCount: 0 });
    const v = p.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    expect(v?.kind === "new" && v.ids[0]).toBe("vocab:w2-0");
  });

  it("오늘 이미 학습한 수는 할당량에서 차감한다", () => {
    const learned = new Set(inventory.vocab.filter((i) => i.week === 1).map((i) => i.id));
    const p = generateDayPlan({ today: "2026-10-15", inventory, learned, dueCount: 0, newDoneToday: { vocab: 30 } });
    const v = p.tasks.find((t) => t.kind === "new" && t.type === "vocab");
    expect(v?.kind === "new" && v.ids.length).toBe(5);
  });

  it("11/25 이후와 9주차는 신규 없이 복습만", () => {
    const p = generateDayPlan({ today: "2026-11-27", inventory, learned: new Set(), dueCount: 12, mocks: [{ id: "mock:01" }] });
    expect(p.newAllowed).toBe(false);
    expect(p.tasks.some((t) => t.kind === "new")).toBe(false);
    expect(p.tasks.some((t) => t.kind === "review")).toBe(true);
    const last = generateDayPlan({ today: "2026-12-05", inventory, learned: new Set(), dueCount: 3 });
    expect(last.newAllowed).toBe(false);
  });

  it("모의고사 주간에는 이틀에 한 번 모의고사", () => {
    const mocks = [{ id: "mock:01" }, { id: "mock:02" }, { id: "mock:03" }];
    const d0 = generateDayPlan({ today: "2026-11-26", inventory, learned: new Set(), dueCount: 0, mocks });
    const d1 = generateDayPlan({ today: "2026-11-27", inventory, learned: new Set(), dueCount: 0, mocks });
    const d2 = generateDayPlan({ today: "2026-11-28", inventory, learned: new Set(), dueCount: 0, mocks });
    expect(d0.tasks.find((t) => t.kind === "mock")).toMatchObject({ refId: "mock:01" });
    expect(d1.tasks.find((t) => t.kind === "mock")).toBeUndefined();
    expect(d2.tasks.find((t) => t.kind === "mock")).toMatchObject({ refId: "mock:02" });
  });

  it("독해/청해는 해당 주차 이하 풀에서 날짜별로 로테이션", () => {
    const readings = [{ id: "reading:w3-01", week: 3 }, { id: "reading:w4-01", week: 4 }, { id: "reading:w6-01", week: 6 }];
    const p = generateDayPlan({ today: "2026-10-30", inventory, learned: new Set(), dueCount: 0, readings });
    const r = p.tasks.find((t) => t.kind === "reading");
    expect(r?.kind === "reading" && ["reading:w3-01", "reading:w4-01"].includes(r.refId)).toBe(true);
  });
});

describe("computePace", () => {
  it("첫날은 현재 주차 분량의 1/7 이 기대치", () => {
    const pace = computePace("2026-10-08", inventory, new Set());
    expect(pace.byType.vocab.expected).toBe(Math.round(150 / 7));
    expect(pace.byType.kanji.expected).toBe(5);
  });
  it("다 끝내면 ahead", () => {
    const learned = new Set(Object.values(inventory).flat().map((i) => i.id));
    expect(computePace("2026-10-08", inventory, learned).mode).toBe("ahead");
  });
});
