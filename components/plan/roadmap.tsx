"use client";

import { use, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { CURRICULUM, LAST_NEW_DAY } from "@/data/curriculum";
import { getInventory } from "@/lib/content/inventory";
import { CARD_TYPES, TYPE_LABEL } from "@/lib/content/types";
import { daysBetween, formatKoDate, todayStr } from "@/lib/date";
import { useAllCards, useNow, useSettings } from "@/lib/db-hooks";
import { computePace } from "@/lib/plan";

/** 9주 로드맵: 주차별 테마·포커스·신규 분량·진행률. 현재 주차는 펼쳐서 강조. */
export function Roadmap() {
  const inventory = use(getInventory());
  const now = useNow();
  const today = todayStr(new Date(now));
  const cards = useAllCards();
  const settings = useSettings();
  const [open, setOpen] = useState<number | null>(null);

  if (!cards) return null;
  const learned = new Set(cards.map((c) => c.id));
  const pace = computePace(today, inventory.items, learned);
  const totalDays = daysBetween(CURRICULUM[0].start, settings.examDate);
  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(CURRICULUM[0].start, today)));

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex items-center justify-between text-sm">
          <span>{formatKoDate(CURRICULUM[0].start)} 시작</span>
          <span className="font-semibold">D-{Math.max(0, daysBetween(today, settings.examDate))}</span>
          <span>{formatKoDate(settings.examDate)} 시험</span>
        </div>
        <ProgressBar value={elapsed} max={totalDays} className="mt-2" />
        <p className="mt-2 text-xs text-muted">
          신규 학습은 {formatKoDate(LAST_NEW_DAY)}까지. 이후는 복습·모의고사·오답 정리만.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {CARD_TYPES.map((t) => {
            const p = pace.byType[t];
            return (
              <div key={t} className="rounded-lg bg-surface-2 p-2">
                <p className="text-muted">{TYPE_LABEL[t]}</p>
                <p className="font-semibold">
                  {p.learned} <span className="font-normal text-muted">/ {p.total}</span>
                </p>
                <p className={p.learned >= p.expected ? "text-success" : "text-warning"}>
                  {p.learned >= p.expected ? "계획대로" : `${p.expected - p.learned}개 뒤처짐`}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <ol className="grid gap-3">
        {CURRICULUM.map((w) => {
          const isCurrent = today >= w.start && today <= w.end;
          const isPast = today > w.end;
          const expanded = open === w.week || (open === null && isCurrent);
          const counts = CARD_TYPES.map((t) => {
            const items = inventory.items[t].filter((i) => i.week === w.week);
            return { t, total: items.length, done: items.filter((i) => learned.has(i.id)).length };
          }).filter((c) => c.total > 0);
          const total = counts.reduce((s, c) => s + c.total, 0);
          const done = counts.reduce((s, c) => s + c.done, 0);
          return (
            <li key={w.week}>
              <Card className={`${isCurrent ? "border-brand" : ""} ${isPast ? "opacity-80" : ""}`}>
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(expanded ? -1 : w.week)}>
                  <div>
                    <p className="text-xs text-muted">
                      {w.week}주차 · {formatKoDate(w.start)} ~ {formatKoDate(w.end)}
                      {isCurrent && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] text-brand-fg">이번 주</span>}
                    </p>
                    <p className="mt-0.5 font-semibold">{w.title}</p>
                  </div>
                  <span className="text-xs text-muted">{total > 0 ? `${done}/${total}` : w.reviewOnly ? "복습만" : ""}</span>
                </button>
                {total > 0 && <ProgressBar value={done} max={total} className="mt-2" color={isPast && done < total ? "bg-warning" : "bg-brand"} />}
                {expanded && (
                  <div className="mt-3 text-sm">
                    <p className="text-muted">{w.theme}</p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5">
                      {w.focus.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {counts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {counts.map((c) => (
                          <span key={c.t} className="rounded-full bg-surface-2 px-2 py-1">
                            {TYPE_LABEL[c.t]} {c.done}/{c.total} · 하루 {w.newPerDay[c.t]}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      보조 활동: {w.extras.map((e) => ({ "kana-quiz": "가나 퀴즈", reading: "독해", listening: "청해", mock: "모의고사", mistakes: "오답노트" })[e]).join(", ") || "없음"}
                    </p>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
