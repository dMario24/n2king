"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getDb, getSettings, type Daily, type Settings } from "./db";
import type { Card } from "./srs";
import type { CardContentType } from "./content/types";
import { addDays, todayStr } from "./date";

/** 1분마다 갱신되는 현재 시각 (만기 계산용). Activity 로 숨겨지면 타이머가 정리된다. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useToday(): string {
  const now = useNow();
  return todayStr(new Date(now));
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
}

export function useDueCards(now: number, type?: CardContentType): Card[] | undefined {
  return useLiveQuery(async () => {
    const db = getDb();
    const coll = type ? db.cards.where("type").equals(type) : db.cards.toCollection();
    const cards = await coll.filter((c) => !c.suspended && c.due <= now).toArray();
    return cards.sort((a, b) => a.due - b.due);
  }, [now, type]);
}

export function useDueCount(now: number): number | undefined {
  return useLiveQuery(() => getDb().cards.filter((c) => !c.suspended && c.due <= now).count(), [now]);
}

export function useCardsByType(type: CardContentType): Card[] | undefined {
  return useLiveQuery(() => getDb().cards.where("type").equals(type).toArray(), [type]);
}

export function useAllCards(): Card[] | undefined {
  return useLiveQuery(() => getDb().cards.toArray(), []);
}

export function useCard(id: string): Card | undefined {
  return useLiveQuery(() => getDb().cards.get(id), [id]);
}

export function useDaily(date: string): Daily | undefined {
  return useLiveQuery(() => getDb().daily.get(date), [date]);
}

export function useRecentDaily(days: number, today: string): Daily[] | undefined {
  return useLiveQuery(async () => {
    const from = addDays(today, -(days - 1));
    return getDb().daily.where("date").between(from, today, true, true).toArray();
  }, [days, today]);
}

/** 연속 학습일. 오늘 활동이 없으면 어제까지의 연속을 센다. */
export function useStreak(today: string): number | undefined {
  return useLiveQuery(async () => {
    const rows = await getDb().daily.toArray();
    const active = new Set(
      rows
        .filter((d) => d.reviews > 0 || d.quizTotal > 0 || Object.values(d.newByType).some((n) => (n ?? 0) > 0))
        .map((d) => d.date),
    );
    let day = active.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (active.has(day)) {
      n++;
      day = addDays(day, -1);
    }
    return n;
  }, [today]);
}

export function useMistakes(unresolvedOnly = true) {
  return useLiveQuery(async () => {
    const all = await getDb().mistakes.orderBy("lastTs").reverse().toArray();
    return unresolvedOnly ? all.filter((m) => !m.resolvedAt) : all;
  }, [unresolvedOnly]);
}
