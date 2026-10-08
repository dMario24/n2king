import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { Roadmap } from "@/components/plan/roadmap";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "플랜" };

export default function PlanPage() {
  return (
    <>
      <PageHeader title="59일 로드맵" description="가나 → 기초 압축 → N2 문법·어휘·한자 → 독해·청해 → 모의고사" />
      <Suspense fallback={<CardSkeleton lines={8} />}>
        <ClientOnly>
          <Roadmap />
        </ClientOnly>
      </Suspense>
    </>
  );
}
