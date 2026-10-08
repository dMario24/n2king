import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Jp } from "@/components/jp";
import { ListeningPlayer } from "@/components/listening/listening-player";
import { PageHeader } from "@/components/ui/page-header";
import { LISTENING } from "@/data/listening";
import { slugOf } from "@/lib/plan";

export function generateStaticParams() {
  return LISTENING.map((l) => ({ slug: slugOf(l.id) }));
}

export default function ListeningPage({ params }: PageProps<"/listening/[slug]">) {
  return (
    <Suspense fallback={<CardSkeleton lines={6} />}>
      <ListeningContent params={params} />
    </Suspense>
  );
}

async function ListeningContent({ params }: { params: PageProps<"/listening/[slug]">["params"] }) {
  const { slug } = await params;
  const script = LISTENING.find((l) => slugOf(l.id) === slug);
  if (!script) notFound();
  return (
    <>
      <PageHeader title={<Jp>{script.title}</Jp>} description={`${script.week}주차`} />
      <ListeningPlayer script={script} />
    </>
  );
}
