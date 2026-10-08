"use client";

import { useEffect } from "react";

/** 프로덕션에서만 서비스 워커를 등록한다 (개발 중 캐시 혼란 방지). */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
