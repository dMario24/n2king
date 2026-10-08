"use client";

import Link from "next/link";
import { use } from "react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StackedBar } from "@/components/ui/progress";
import { getInventory } from "@/lib/content/inventory";
import { CARD_TYPES, TYPE_LABEL } from "@/lib/content/types";
import { formatKoDate } from "@/lib/date";
import { useAllCards, useDaily, useDueCount, useMistakes, useNow, useSettings, useStreak } from "@/lib/db-hooks";
import { generateDayPlan, type Task } from "@/lib/plan";
import { masteryOf } from "@/lib/srs";
import { todayStr } from "@/lib/date";

const TASK_ICON: Record<Task["kind"], string> = {
  review: "🔁",
  new: "✨",
  quiz: "❓",
  reading: "📖",
  listening: "🎧",
  mock: "📝",
  mistakes: "📒",
};

export function Dashboard() {
  const inventory = use(getInventory());
  const now = useNow();
  const today = todayStr(new Date(now));
  const settings = useSettings();
  const dueCount = useDueCount(now);
  const cards = useAllCards();
  const daily = useDaily(today);
  const streak = useStreak(today);
  const mistakes = useMistakes(true);

  if (dueCount === undefined || cards === undefined) return null;

  const learned = new Set(cards.map((c) => c.id));
  const plan = generateDayPlan({
    today,
    examDate: settings.examDate,
    intensity: settings.intensity,
    inventory: inventory.items,
    learned,
    dueCount,
    readings: inventory.readings,
    listenings: inventory.listenings,
    mocks: inventory.mocks,
    mistakeCount: mistakes?.length ?? 0,
    newDoneToday: daily?.newByType,
  });
  const done = new Set(daily?.tasksDone ?? []);
  const pending = plan.tasks.filter((t) => !done.has(t.id));
  const newToday = Object.values(daily?.newByType ?? {}).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        {/* D-day 히어로 */}
        <Card className="bg-gradient-to-br from-brand to-indigo-400 text-white dark:to-indigo-700">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm/5 opacity-90">{formatKoDate(today)} · JLPT N2 {settings.examDate.replace(/-/g, ".")}</p>
              <p className="mt-1 text-4xl font-black tracking-tight">
                {plan.dday > 0 ? `D-${plan.dday}` : plan.dday === 0 ? "D-DAY" : "시험 종료"}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="opacity-90">연속 학습</p>
              <p className="text-2xl font-bold">{streak ?? 0}일 🔥</p>
            </div>
          </div>
          {plan.week && (
            <div className="mt-4 rounded-xl bg-white/15 p-3 text-sm">
              <p className="font-semibold">{plan.week.week}주차 · {plan.week.title}</p>
              <p className="mt-0.5 opacity-90">{plan.week.theme}</p>
            </div>
          )}
        </Card>

        {/* 빠른 시작 */}
        <div className="grid grid-cols-2 gap-3">
          <LinkButton href={`/review?limit=${settings.quickBatch}`} size="lg" className="flex-col gap-0 py-3">
            <span className="text-base">⚡ {settings.quickBatch}장 복습</span>
            <span className="text-xs font-normal opacity-80">짜투리 3분 · 만기 {dueCount}장</span>
          </LinkButton>
          <LinkButton href="/focus" size="lg" variant="secondary" className="flex-col gap-0 py-3">
            <span className="text-base">🎯 집중 세션</span>
            <span className="text-xs font-normal opacity-80">25분 · 오늘 할 일 순서대로</span>
          </LinkButton>
        </div>

        {/* 오늘 할 일 */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">오늘 할 일</h2>
            <span className="text-xs text-muted">예상 {pending.reduce((s, t) => s + t.estMin, 0)}분</span>
          </div>
          {pending.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-4 text-center text-sm">
              오늘 계획을 모두 끝냈어요 🎉 <br />
              <span className="text-muted">여유가 있다면 복습을 더 하거나 퀴즈로 점검하세요.</span>
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((t) => (
                <li key={t.id}>
                  <Link href={t.href} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span className="text-xl" aria-hidden="true">{TASK_ICON[t.kind]}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{t.title}</span>
                      {t.kind === "new" && (
                        <span className="block text-xs text-muted">{TYPE_LABEL[t.type]} · 주차별 핵심 항목</span>
                      )}
                    </span>
                    <span className="text-xs text-muted">{t.estMin}분</span>
                    <span className="text-muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {plan.tasks.some((t) => done.has(t.id)) && (
            <p className="mt-2 text-xs text-muted">
              완료: {plan.tasks.filter((t) => done.has(t.id)).map((t) => t.title).join(", ")}
            </p>
          )}
          {!plan.newAllowed && plan.dday > 0 && (
            <p className="mt-3 rounded-lg bg-brand-soft p-2 text-xs text-brand">신규 학습 기간이 끝났어요. 복습과 오답 정리에 집중하세요.</p>
          )}
        </Card>

        {/* 페이스 */}
        {plan.pace.mode !== "on-track" && (
          <Card className={plan.pace.mode === "behind" ? "border-warning/40" : "border-success/40"}>
            <p className="text-sm">
              {plan.pace.mode === "behind" && (
                <>
                  <b>계획보다 {plan.pace.behind}개 뒤처져 있어요.</b> 밀린 분량은 2주에 걸쳐 자동으로 나눠 배정됩니다. 버겁다면{" "}
                  <Link href="/settings" className="underline">설정</Link>에서 강도를 낮추세요.
                </>
              )}
              {plan.pace.mode === "ahead" && <b>계획보다 앞서가고 있어요. 복습 품질을 유지하세요 👍</b>}
            </p>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 오늘 활동 */}
        <Card>
          <h2 className="mb-3 font-semibold">오늘 활동</h2>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat label="복습" value={daily?.reviews ?? 0} />
            <Stat label="신규" value={newToday} />
            <Stat label="퀴즈 정답" value={daily?.quizTotal ? `${daily.quizCorrect}/${daily.quizTotal}` : "-"} />
          </dl>
        </Card>

        {/* 숙련도 */}
        <Card>
          <h2 className="mb-3 font-semibold">숙련도</h2>
          <ul className="flex flex-col gap-3">
            {CARD_TYPES.map((t) => {
              const total = inventory.items[t].length;
              const mine = cards.filter((c) => c.type === t);
              const m = { mature: 0, young: 0, learning: 0 };
              for (const c of mine) {
                const k = masteryOf(c);
                if (k !== "unseen") m[k]++;
              }
              return (
                <li key={t}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{TYPE_LABEL[t]}</span>
                    <span className="text-muted">
                      {mine.length}/{total} 시작 · 정착 {m.mature}
                    </span>
                  </div>
                  <StackedBar
                    total={total}
                    segments={[
                      { value: m.mature, color: "bg-success", label: "정착" },
                      { value: m.young, color: "bg-brand", label: "익히는 중" },
                      { value: m.learning, color: "bg-warning", label: "학습 중" },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex gap-3 text-[11px] text-muted">
            <span><i className="inline-block size-2 rounded-full bg-success" /> 정착</span>
            <span><i className="inline-block size-2 rounded-full bg-brand" /> 익히는 중</span>
            <span><i className="inline-block size-2 rounded-full bg-warning" /> 학습 중</span>
          </p>
        </Card>

        {(mistakes?.length ?? 0) > 0 && (
          <Card>
            <Link href="/mistakes" className="flex items-center justify-between text-sm">
              <span>📒 오답노트 <b>{mistakes!.length}</b>개</span>
              <span className="text-muted">›</span>
            </Link>
          </Card>
        )}
      </div>
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
