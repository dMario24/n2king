import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LISTENING } from "@/data/listening";
import { slugOf } from "@/lib/plan";

export const metadata = { title: "청해" };
const KIND_LABEL = { task: "과제이해", point: "포인트이해", summary: "개요이해", quick: "즉시응답", integrated: "통합이해" } as const;

export default function ListeningList() {
  return (
    <>
      <PageHeader title="청해" description="브라우저 음성(TTS)으로 재생됩니다. 설정에서 일본어 음성을 고르세요." />
      {LISTENING.length === 0 ? (
        <Card className="text-sm text-muted">청해 스크립트가 준비 중입니다.</Card>
      ) : (
        <ul className="grid gap-2">
          {LISTENING.map((l) => (
            <li key={l.id}>
              <Link href={`/listening/${slugOf(l.id)}`}>
                <Card className="flex items-center gap-3 hover:border-brand/50">
                  <span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">{l.week}주</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium"><span lang="ja">{l.title}</span></span>
                    <span className="block text-xs text-muted">{KIND_LABEL[l.kind]} · {l.lines.length}줄 · {l.questions.length}문제</span>
                  </span>
                  <span className="text-muted">›</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
