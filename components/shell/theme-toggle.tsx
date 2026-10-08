"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export const THEME_KEY = "n2king:theme";
type Theme = "light" | "dark";

function readStored(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "light" ? t : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

/** <html data-theme> 속성을 외부 스토어로 구독한다 (hydration 안전). */
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getSnapshot = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
const getServerSnapshot = (): Theme => "light";

/**
 * 테마 토글. 초기 적용은 layout 의 인라인 스크립트가 페인트 전에 처리하고,
 * 여기서는 dev Strict Mode 재마운트로 속성이 지워지는 경우를 useLayoutEffect 로 복구한다.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    applyTheme(readStored() ?? systemTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
    >
      {theme === "dark" ? "라이트" : "다크"}
    </button>
  );
}
