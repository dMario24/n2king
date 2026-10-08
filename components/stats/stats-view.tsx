"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { StackedBar } from "@/components/ui/progress";
import { getInventory } from "@/lib/content/inventory";
import { CARD_TYPES, TYPE_LABEL } from "@/lib/content/types";
import { addDays, todayStr } from "@/lib/date";
import { useAllCards, useNow, useRecentDaily, useStreak } from "@/lib/db-hooks";
import { masteryOf } from "@/lib/srs";

export function StatsView() {
  const inventory = use(getInventory());
  const now = useNow();
  const today = todayStr(new Date(now));
  const recent = useRecentDaily(28, today);
  const cards = useAllCards();
  const streak = useStreak(today);
  if (!recent || !cards) return null;

  const byDate = new Map(recent.map((d) => [d.date, d]));
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, -(27 - i)));
  const totals = recent.reduce(
    (a, d) => ({
      reviews: a.reviews + d.reviews,
      newItems: a.newItems + Object.values(d.newByType).reduce((s, n) => s + (n ?? 0), 0),
      quizCorrect: a.quizCorrect + d.quizCorrect,
      quizTotal: a.quizTotal + d.quizTotal,
      minutes: a.minutes + d.minutes,
    }),
    { reviews: 0, newItems: 0, quizCorrect: 0, quizTotal: 0, minutes: 0 },
  );
  const maxReviews = Math.max(1, ...recent.map((d) => d.reviews));
  const dueTomorrow = cards.filter((c) => !c.suspended && c.due <= now + 86_400_000).length;
  const dueWeek = cards.filter((c) => !c.suspended && c.due <= now + 7 * 86_400_000).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-semibold">최근 28일</h2>
        <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Stat label="연속 학습" value={`${streak ?? 0}일`} />
          <Stat label="복습" value={totals.reviews} />
          <Stat label="신규" value={totals.newItems} />
          <Stat label="학습 시간" value={`${totals.minutes}분`} />
        </dl>
        <p className="mt-2 text-center text-xs text-muted">
          퀴즈 정답률 {totals.quizTotal ? `${Math.round((totals.quizCorrect / totals.quizTotal) * 100)}% (${totals.quizCorrect}/${totals.quizTotal})` : "-"}
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">일별 복습량</h2>
        <div className="flex h-24 items-end gap-0.5" role="img" aria-label="최근 28일 일별 복습 수">
          {days.map((d) => {
            const v = byDate.get(d)?.reviews ?? 0;
            return (
              <div key={d} className="flex-1 rounded-t bg-brand/80" style={{ height: `${Math.max(v ? 6 : 2, (v / maxReviews) * 100)}%` }} title={`${d}: ${v}`} />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{days[0].slice(5)}</span>
          <span>오늘</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">복습 부하 전망</h2>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="지금 만기" value={cards.filter((c) => !c.suspended && c.due <= now).length} />
          <Stat label="24시간 내" value={dueTomorrow} />
          <Stat label="7일 내" value={dueWeek} />
        </dl>
        <p className="mt-2 text-xs text-muted">총 카드 {cards.length}장 · 일시중지 {cards.filter((c) => c.suspended).length}장 · 재학습 {cards.filter((c) => c.state === "relearning").length}장</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">숙련도</h2>
        <ul className="flex flex-col gap-3">
          {CARD_TYPES.map((t) => {
            const total = inventory.items[t].length;
            const m = { mature: 0, young: 0, learning: 0 };
            for (const c of cards) if (c.type === t) {
              const k = masteryOf(c);
              if (k !== "unseen") m[k]++;
            }
            const started = m.mature + m.young + m.learning;
            return (
              <li key={t}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{TYPE_LABEL[t]}</span>
                  <span className="text-muted">정착 {m.mature} · 익히는 중 {m.young} · 학습 중 {m.learning} · 미학습 {total - started}</span>
                </div>
                <StackedBar total={total} segments={[{ value: m.mature, color: "bg-success", label: "정착" }, { value: m.young, color: "bg-brand", label: "익히는 중" }, { value: m.learning, color: "bg-warning", label: "학습 중" }]} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-lg font-bold">{value}</dd>
    </div>
  );
}
