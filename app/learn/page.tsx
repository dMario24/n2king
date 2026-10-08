import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { KANA } from "@/data/kana";
import { VOCAB } from "@/data/vocab";
import { KANJI } from "@/data/kanji";
import { GRAMMAR } from "@/data/grammar";
import { READING } from "@/data/reading";
import { LISTENING } from "@/data/listening";

const HUBS = [
  { href: "/learn/kana", title: "가나", desc: "히라가나·가타카나 50음도, 탁음·요음", count: KANA.length, unit: "자", emoji: "あ" },
  { href: "/learn/vocab", title: "어휘", desc: "기초 → N2 핵심 어휘, 주차별", count: VOCAB.length, unit: "개", emoji: "語" },
  { href: "/learn/kanji", title: "한자", desc: "N5 → N2 한자, 음독·훈독·대표 단어", count: KANJI.length, unit: "자", emoji: "漢" },
  { href: "/learn/grammar", title: "문법", desc: "기초 활용 → N2 문형, 예문·빈칸", count: GRAMMAR.length, unit: "개", emoji: "法" },
  { href: "/reading", title: "독해", desc: "단문 → 장문, 정보 검색", count: READING.length, unit: "편", emoji: "読" },
  { href: "/listening", title: "청해", desc: "과제이해·포인트이해·즉시응답", count: LISTENING.length, unit: "개", emoji: "聴" },
];

export default function LearnHub() {
  return (
    <>
      <PageHeader title="학습" description="오늘 할 일은 홈에서, 전체 탐색은 여기서." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HUBS.map((h) => (
          <Link key={h.href} href={h.href}>
            <Card className="flex h-full items-center gap-4 hover:border-brand/50">
              <span lang="ja" className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl font-bold text-brand">
                {h.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{h.title} <span className="text-xs font-normal text-muted">{h.count}{h.unit}</span></span>
                <span className="block truncate text-sm text-muted">{h.desc}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
