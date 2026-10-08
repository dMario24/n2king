"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addMinutes } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { formatMMSS, remainingMs, stopFocus, useFocusState } from "@/lib/focus";

/** 집중 세션 중 모든 페이지 상단에 떠 있는 타이머 배지. 끝나면 진동/알림 후 학습 시간을 기록한다. */
export function FocusBadge() {
  const focus = useFocusState();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!focus) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [focus]);

  useEffect(() => {
    if (!focus || !now) return;
    if (remainingMs(focus, now) <= 0) {
      stopFocus();
      void addMinutes(todayStr(), focus.durationMin);
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {}
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("집중 세션 완료 🎉", { body: `${focus.durationMin}분 동안 수고했어요. 잠깐 쉬고 다음 세션으로!` });
      } else {
        alert(`집중 세션 ${focus.durationMin}분 완료! 잠깐 쉬어가세요.`);
      }
    }
  }, [focus, now]);

  if (!focus) return null;
  const rem = now ? remainingMs(focus, now) : focus.durationMin * 60_000;
  return (
    <Link
      href="/focus"
      className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 font-mono text-sm font-semibold text-brand-fg shadow-lg md:right-6 md:top-6"
      aria-live="polite"
    >
      🎯 {formatMMSS(rem)}
    </Link>
  );
}
