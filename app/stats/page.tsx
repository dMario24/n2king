import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { StatsView } from "@/components/stats/stats-view";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "통계" };

export default function StatsPage() {
  return (
    <>
      <PageHeader title="통계" description="꾸준함이 합격을 만든다" />
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <ClientOnly>
          <StatsView />
        </ClientOnly>
      </Suspense>
    </>
  );
}
