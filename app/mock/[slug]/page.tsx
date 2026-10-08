import { notFound } from "next/navigation";
import { MockRunner } from "@/components/mock/mock-runner";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK } from "@/data/mock";
import { slugOf } from "@/lib/plan";

export function generateStaticParams() {
  return MOCK.map((m) => ({ slug: slugOf(m.id) }));
}

export default async function MockPage({ params }: PageProps<"/mock/[slug]">) {
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
