"use client";

import { use, useState } from "react";
import { Jp } from "@/components/jp";
import { Card } from "@/components/ui/card";
import { KANA_ROWS } from "@/data/kana";
import { getContentMaps } from "@/lib/content/lookup";
import { useCardsByType, useSettings } from "@/lib/db-hooks";
import { masteryOf } from "@/lib/srs";
import { speak } from "@/lib/tts";

const GROUPS: { key: "basic" | "dakuten" | "youon"; label: string }[] = [
  { key: "basic", label: "청음 (기본 46)" },
  { key: "dakuten", label: "탁음·반탁음" },
  { key: "youon", label: "요음" },
];

export function KanaGrid() {
  const maps = use(getContentMaps());
  const cards = useCardsByType("kana");
  const settings = useSettings();
  const [script, setScript] = useState<"hiragana" | "katakana">("hiragana");
  const [showRomaji, setShowRomaji] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  const cardMap = new Map((cards ?? []).map((c) => [c.id, c]));
  const list = maps.lists.kana.filter((k) => k.script === script);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-surface-2 p-1 text-sm">
          {(["hiragana", "katakana"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScript(s)}
              className={`rounded-lg px-4 py-1.5 ${script === s ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
            >
              {s === "hiragana" ? "히라가나" : "가타카나"}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1 text-xs text-muted">
          <input type="checkbox" checked={showRomaji} onChange={(e) => setShowRomaji(e.target.checked)} /> 로마자 표시
        </label>
      </div>

      {GROUPS.map((g) => {
        const rows = KANA_ROWS[g.key];
        return (
          <section key={g.key} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted">{g.label}</h2>
            <Card className="p-2">
              <div className="flex flex-col gap-1">
                {rows.map((row) => (
                  <div key={row} className="grid grid-cols-5 gap-1">
                    {list
                      .filter((k) => k.row === row)
                      .map((k) => {
                        const m = masteryOf(cardMap.get(k.id));
                        const isActive = active === k.id;
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => {
                              setActive(k.id);
                              void speak(k.kana, { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
                            }}
                            className={`flex h-16 flex-col items-center justify-center rounded-xl border text-2xl transition-colors ${
                              isActive ? "border-brand bg-brand-soft" : "border-transparent hover:bg-surface-2"
                            } ${m === "mature" ? "text-success" : m === "unseen" ? "" : "text-brand"}`}
                          >
                            <Jp>{k.kana}</Jp>
                            {showRomaji && <span className="text-[10px] text-muted">{k.romaji}</span>}
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        );
      })}
      <p className="text-xs text-muted">글자를 누르면 발음이 재생됩니다. 색: 파랑=학습 중, 초록=정착.</p>
    </div>
  );
}
