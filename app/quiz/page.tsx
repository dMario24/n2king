import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { QUIZ_MODE_LABEL, type QuizMode } from "@/lib/plan";

const MODES: { mode: QuizMode; desc: string; emoji: string }[] = [
  { mode: "kana", desc: "가나를 보고 로마자 고르기", emoji: "あ" },
  { mode: "vocab-meaning", desc: "단어를 보고 뜻 고르기", emoji: "語" },
  { mode: "vocab-reading", desc: "단어를 보고 읽기(히라가나) 고르기", emoji: "読" },
  { mode: "kanji-reading", desc: "한자어 읽기 (시험 문자 파트)", emoji: "漢" },
  { mode: "kanji-meaning", desc: "한자를 보고 뜻 고르기", emoji: "意" },
  { mode: "grammar-cloze", desc: "빈칸에 맞는 문형 고르기 (문법 파트)", emoji: "法" },
  { mode: "listening", desc: "예문을 듣고 뜻 고르기", emoji: "聴" },
];

export default function QuizHub() {
  return (
    <>
      <PageHeader title="퀴즈" description="학습한 카드에서 우선 출제. 틀린 문제는 오답노트로." />
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <Card key={m.mode} className="flex items-center gap-4">
            <span lang="ja" className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl font-bold text-brand">{m.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{QUIZ_MODE_LABEL[m.mode]}</p>
              <p className="truncate text-sm text-muted">{m.desc}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1 text-xs">
              <Link href={`/quiz/${m.mode}?n=10`} className="rounded-lg bg-brand px-3 py-1.5 text-center text-brand-fg">10문제</Link>
              <Link href={`/quiz/${m.mode}?n=20`} className="rounded-lg bg-surface-2 px-3 py-1.5 text-center">20문제</Link>
            </div>
          </Card>
        ))}
        <Card className="flex items-center gap-4 border-dashed">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">📒</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">오답 재시험</p>
            <p className="truncate text-sm text-muted">오답노트의 항목만 다시 출제. 맞히면 해결 처리</p>
          </div>
          <Link href="/quiz/mistakes?n=20" className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-xs">시작</Link>
        </Card>
      </div>
    </>
  );
}
