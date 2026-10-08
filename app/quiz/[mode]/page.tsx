import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { QuizSession, type AnyMode } from "@/components/quiz/quiz-session";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { QUIZ_MODE_LABEL } from "@/lib/plan";

const MODES: AnyMode[] = ["kana", "vocab-meaning", "vocab-reading", "kanji-reading", "kanji-meaning", "grammar-cloze", "listening", "mistakes"];

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }));
}

export default function QuizModePage({ params }: PageProps<"/quiz/[mode]">) {
  return (
    <Suspense fallback={<CardSkeleton lines={6} />}>
      <QuizModeContent params={params} />
    </Suspense>
  );
}

async function QuizModeContent({ params }: { params: PageProps<"/quiz/[mode]">["params"] }) {
  const { mode } = await params;
  if (!MODES.includes(mode as AnyMode)) notFound();
  const m = mode as AnyMode;
  return (
    <>
      <PageHeader title={m === "mistakes" ? "오답 재시험" : QUIZ_MODE_LABEL[m]} />
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <ClientOnly>
          <QuizSession mode={m} />
        </ClientOnly>
      </Suspense>
    </>
  );
}
