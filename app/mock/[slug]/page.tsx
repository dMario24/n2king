import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CardSkeleton } from "@/components/ui/skeleton";
import { MockRunner } from "@/components/mock/mock-runner";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK } from "@/data/mock";
import { slugOf } from "@/lib/plan";

export function generateStaticParams() {
  return MOCK.map((m) => ({ slug: slugOf(m.id) }));
}

export default function MockPage({ params }: PageProps<"/mock/[slug]">) {
  return (
    <Suspense fallback={<CardSkeleton lines={6} />}>
      <MockContent params={params} />
    </Suspense>
  );
}

async function MockContent({ params }: { params: PageProps<"/mock/[slug]">["params"] }) {
  const { slug } = await params;
  const exam = MOCK.find((m) => slugOf(m.id) === slug);
  if (!exam) notFound();
  return (
    <>
      <PageHeader title={exam.title} />
      <MockRunner exam={exam} />
    </>
  );
}
