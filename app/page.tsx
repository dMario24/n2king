import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { Dashboard } from "@/components/dashboard/dashboard";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={4} />
          </div>
          <CardSkeleton lines={4} />
        </div>
      }
    >
      <ClientOnly>
        <Dashboard />
      </ClientOnly>
    </Suspense>
  );
}
