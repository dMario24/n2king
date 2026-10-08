"use client";

import { useSyncExternalStore } from "react";

/**
 * 집중 세션 타이머 상태. 페이지를 옮겨도 유지되도록 localStorage 에 시작 시각만 저장하고
 * 남은 시간은 매번 계산한다. (라우트 이동 시 effect 가 정리되어도 상태가 끊기지 않음)
 */
export interface FocusState {
  startedAt: number;
  durationMin: number;
}

const KEY = "n2king:focus";
const EVT = "n2king:focus-change";

export function readFocus(): FocusState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FocusState) : null;
  } catch {
    return null;
  }
}

export function startFocus(durationMin: number) {
  localStorage.setItem(KEY, JSON.stringify({ startedAt: Date.now(), durationMin } satisfies FocusState));
  window.dispatchEvent(new Event(EVT));
}

export function stopFocus() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

let cache: { raw: string | null; value: FocusState | null } = { raw: null, value: null };
function getSnapshot(): FocusState | null {
  const raw = localStorage.getItem(KEY);
  if (raw !== cache.raw) cache = { raw, value: raw ? (JSON.parse(raw) as FocusState) : null };
  return cache.value;
}

export function useFocusState(): FocusState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function remainingMs(f: FocusState, now: number): number {
  return f.startedAt + f.durationMin * 60_000 - now;
}

export function formatMMSS(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
