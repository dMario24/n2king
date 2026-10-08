import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { MistakeList } from "@/components/mistakes/mistake-list";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "오답노트" };

export default function MistakesPage() {
  return (
    <>
      <PageHeader title="오답노트" description="틀린 문제는 자동으로 모입니다. 재시험에서 맞히면 해결 처리돼요." />
      <Suspense fallback={<CardSkeleton lines={5} />}>
        <ClientOnly>
          <MistakeList />
        </ClientOnly>
      </Suspense>
    </>
  );
}
