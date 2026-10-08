import { describe, expect, it } from "vitest";
import { parseScript, splitSentences } from "@/lib/tts";

describe("splitSentences", () => {
  it("句点·물음표·감탄 기준으로 나눈다", () => {
    expect(splitSentences("今日は晴れです。明日はどうですか？行きましょう！")).toEqual(["今日は晴れです。", "明日はどうですか？", "行きましょう！"]);
  });
  it("긴 문장은 読点에서 추가로 나누고, 구두점이 없으면 통째로", () => {
    const long = "あ".repeat(100) + "、" + "い".repeat(100) + "。";
    const parts = splitSentences(long, 120);
    expect(parts).toHaveLength(2);
    expect(parts.join("")).toBe(long);
    expect(splitSentences("たべる")).toEqual(["たべる"]);
  });
});

describe("parseScript", () => {
  it("男/女/N 접두를 화자로 변환한다", () => {
    expect(parseScript("男：おはよう。\n女：おはようございます。\nN：男の人は何をしますか。")).toEqual([
      { text: "おはよう。", speaker: "A" },
      { text: "おはようございます。", speaker: "B" },
      { text: "男の人は何をしますか。", speaker: "N" },
    ]);
  });
  it("접두가 없는 줄은 화자 없이 그대로", () => {
    expect(parseScript("こんにちは")).toEqual([{ text: "こんにちは" }]);
  });
});
