"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInventory } from "@/lib/content/inventory";
import { nowMs, todayStr } from "@/lib/date";
import { addMinutes } from "@/lib/db";
import { useAllCards, useDaily, useDueCount, useMistakes, useNow, useSettings } from "@/lib/db-hooks";
import { formatMMSS, remainingMs, startFocus, stopFocus, useFocusState } from "@/lib/focus";
import { generateDayPlan } from "@/lib/plan";

const TASK_ICON = { review: "🔁", new: "✨", quiz: "❓", reading: "📖", listening: "🎧", mock: "📝", mistakes: "📒" } as const;

/**
 * 집중 세션: 25/50분 타이머 + 오늘 할 일을 순서대로. 타이머는 localStorage 기반이라
 * 태스크 페이지로 이동해도 상단 배지로 계속 보인다.
 */
export function FocusSession() {
  const inventory = use(getInventory());
  const now = useNow();
  const today = todayStr(new Date(now));
  const settings = useSettings();
  const dueCount = useDueCount(now);
  const cards = useAllCards();
  const daily = useDaily(today);
  const mistakes = useMistakes(true);
  const focus = useFocusState();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!focus) return;
    const id = setInterval(() => setTick(nowMs()), 250);
    return () => clearInterval(id);
  }, [focus]);

  if (dueCount === undefined || !cards) return null;

  const plan = generateDayPlan({
    today,
    examDate: settings.examDate,
    intensity: settings.intensity,
    inventory: inventory.items,
    learned: new Set(cards.map((c) => c.id)),
    dueCount,
    readings: inventory.readings,
    listenings: inventory.listenings,
    mocks: inventory.mocks,
    mistakeCount: mistakes?.length ?? 0,
    newDoneToday: daily?.newByType,
  });
  const done = new Set(daily?.tasksDone ?? []);

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card className="text-center">
        {focus ? (
          <>
            <p className="text-sm text-muted">집중 중 · {focus.durationMin}분 세션</p>
            <p className="my-2 font-mono text-6xl font-black tabular-nums">{formatMMSS(remainingMs(focus, tick || focus.startedAt))}</p>
            <Button
              variant="secondary"
              onClick={() => {
                const spent = Math.round((nowMs() - focus.startedAt) / 60_000);
                stopFocus();
                if (spent >= 1) void addMinutes(today, spent);
              }}
            >
              세션 종료 (학습 시간 기록)
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">방해 없이 한 번에 집중할 시간을 고르세요</p>
            <div className="mt-3 flex justify-center gap-3">
              <Button size="lg" onClick={() => startFocus(25)}>25분 시작</Button>
              <Button size="lg" variant="secondary" onClick={() => startFocus(50)}>50분 시작</Button>
            </div>
            <p className="mt-3 text-xs text-muted">
              타이머는 페이지를 옮겨도 상단에 계속 표시됩니다. 오늘 누적 {daily?.minutes ?? 0}분.
            </p>
            {typeof Notification !== "undefined" && Notification.permission === "default" && (
              <button type="button" className="mt-2 text-xs underline" onClick={() => Notification.requestPermission()}>
                종료 알림 허용하기
              </button>
            )}
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">세션 순서 (오늘 할 일)</h2>
        <ol className="divide-y divide-border">
          {plan.tasks.map((t, i) => (
            <li key={t.id}>
              <Link href={t.href} className={`flex items-center gap-3 py-3 ${done.has(t.id) ? "opacity-50" : ""}`}>
                <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-xs">{done.has(t.id) ? "✓" : i + 1}</span>
                <span className="text-lg" aria-hidden="true">{TASK_ICON[t.kind]}</span>
                <span className="flex-1 text-sm font-medium">{t.title}</span>
                <span className="text-xs text-muted">{t.estMin}분</span>
              </Link>
            </li>
          ))}
          {plan.tasks.length === 0 && <li className="py-3 text-sm text-muted">오늘 할 일을 모두 마쳤어요. 복습을 더 돌리거나 퀴즈로 점검하세요.</li>}
        </ol>
      </Card>
    </div>
  );
}
