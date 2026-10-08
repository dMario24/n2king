"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";

/** ?mode=new 이면 신규 학습 세션, 아니면 목록. 모바일에서는 상단에 신규 학습 버튼을 보여준다. */
export function ModeSwitch({ newMode, listMode, newHref }: { newMode: ReactNode; listMode: ReactNode; newHref: string }) {
  const params = useSearchParams();
  if (params.get("mode") === "new") return <>{newMode}</>;
  return (
    <>
      <div className="mb-3 md:hidden">
        <LinkButton href={newHref} className="w-full">오늘의 신규 학습 시작</LinkButton>
      </div>
      {listMode}
    </>
  );
}
