import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { FocusSession } from "@/components/focus/focus-session";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "집중 세션" };

export default function FocusPage() {
  return (
    <>
      <PageHeader title="집중 세션" description="데스크톱·책상에서 25~50분, 오늘 할 일을 순서대로" />
      <Suspense fallback={<CardSkeleton lines={5} />}>
        <ClientOnly>
          <FocusSession />
        </ClientOnly>
      </Suspense>
    </>
  );
}
