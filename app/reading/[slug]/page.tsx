import { notFound } from "next/navigation";
import { Jp } from "@/components/jp";
import { ReadingQuestions } from "@/components/reading/reading-questions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { READING } from "@/data/reading";
import { slugOf } from "@/lib/plan";

export function generateStaticParams() {
  return READING.map((r) => ({ slug: slugOf(r.id) }));
}

export default async function ReadingPage({ params }: PageProps<"/reading/[slug]">) {
  const { slug } = await params;
  const passage = READING.find((r) => slugOf(r.id) === slug);
  if (!passage) notFound();
  return (
    <>
      <PageHeader title={<Jp>{passage.title}</Jp>} description={`${passage.week}주차 · ${passage.level} · ${passage.body.length}자`} />
      <div className="grid gap-4 md:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <Card>
            <article lang="ja" className="text-[17px] leading-loose">
              {passage.body.split(/\n\n+/).map((p, i) => (
                <p key={i} className="mb-4 indent-4 last:mb-0">{p}</p>
              ))}
            </article>
          </Card>
          {passage.vocabHints && passage.vocabHints.length > 0 && (
            <details className="rounded-2xl border border-border bg-surface p-4">
              <summary className="cursor-pointer text-sm font-semibold">어휘 힌트 {passage.vocabHints.length}개</summary>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {passage.vocabHints.map((v) => (
                  <li key={v.word}>
                    <Jp>{v.word}</Jp> <span className="text-muted"><Jp>{v.reading}</Jp> · {v.meaning}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <div className="md:sticky md:top-6 md:self-start">
          <ReadingQuestions passage={passage} />
        </div>
      </div>
    </>
  );
}
