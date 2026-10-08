"use client";

import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

/**
 * 데스크톱 단축키. 입력 요소에 포커스가 있으면 무시한다.
 * 라우트가 Activity 로 숨겨지면 effect cleanup 으로 리스너가 해제된다.
 */
export function useHotkeys(map: Record<string, Handler>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key === " " ? "Space" : e.key;
      const h = map[key] ?? map[key.toLowerCase()];
      if (h) {
        e.preventDefault();
        h(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map, enabled]);
}
