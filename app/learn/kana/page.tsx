import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { KanaGrid } from "@/components/learn/kana-grid";
import { NewStudy } from "@/components/learn/new-study";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ModeSwitch } from "@/components/learn/mode-switch";

export const metadata = { title: "가나" };

export default function KanaPage() {
  return (
    <>
      <PageHeader
        title="가나"
        description="1주차 목표: 히라가나·가타카나 100% 읽기"
        action={<LinkButton href="/quiz/kana" variant="secondary" size="sm">가나 퀴즈</LinkButton>}
      />
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <ClientOnly>
          <ModeSwitch newMode={<NewStudy type="kana" />} listMode={<KanaGrid />} newHref="/learn/kana?mode=new" />
        </ClientOnly>
      </Suspense>
    </>
  );
}
