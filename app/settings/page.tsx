import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "설정" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="설정" />
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <ClientOnly>
          <SettingsForm />
        </ClientOnly>
      </Suspense>
    </>
  );
}
