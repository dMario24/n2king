import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomTabs } from "./bottom-tabs";
import { FocusBadge } from "@/components/focus/focus-badge";
import { RegisterSW } from "./register-sw";
import { TtsWarmup } from "./tts-warmup";

/** 서버 컴포넌트 셸: 데스크톱 사이드바 + 본문 + 모바일 하단 탭 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="safe-top mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <BottomTabs />
      <FocusBadge />
      <RegisterSW />
      <TtsWarmup />
    </div>
  );
}
