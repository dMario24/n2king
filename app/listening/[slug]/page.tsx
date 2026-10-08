import { notFound } from "next/navigation";
import { Jp } from "@/components/jp";
import { ListeningPlayer } from "@/components/listening/listening-player";
import { PageHeader } from "@/components/ui/page-header";
import { LISTENING } from "@/data/listening";
import { slugOf } from "@/lib/plan";

export function generateStaticParams() {
  return LISTENING.map((l) => ({ slug: slugOf(l.id) }));
}

export default async function ListeningPage({ params }: PageProps<"/listening/[slug]">) {
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
