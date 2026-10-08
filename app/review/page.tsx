import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { ReviewSession } from "@/components/review/review-session";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "복습" };

export default function ReviewPage() {
  return (
    <>
      <PageHeader title="복습" description="간격 반복으로 잊기 직전에 다시 본다" />
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <ClientOnly>
          <ReviewSession />
        </ClientOnly>
      </Suspense>
    </>
  );
}
