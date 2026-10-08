"use client";

import { use, type ReactNode } from "react";
import { browser } from "react-dom";

/**
 * 브라우저에서만 렌더링한다. 프리렌더(빌드) 중에는 가장 가까운 <Suspense> 로 suspend 되어
 * fallback 이 정적 HTML 이 되고, 브라우저에서는 실제 데이터(IndexedDB·현재 시각)로 한 번에 렌더링된다.
 * cacheComponents 환경에서 hydration 불일치 없이 클라이언트 상태를 읽는 표준 패턴.
 */
export function ClientOnly({
  children,
  reason = "학습 기록은 브라우저 IndexedDB 에서만 읽습니다.",
}: {
  children: ReactNode;
  reason?: string;
}) {
  use(browser(reason));
  return children;
}
