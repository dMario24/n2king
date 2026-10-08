import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { READING } from "@/data/reading";
import { slugOf } from "@/lib/plan";

export const metadata = { title: "독해" };

export default function ReadingList() {
  return (
    <>
      <PageHeader title="독해" description="단문 → 중문 → 장문 → 정보 검색. 주차 순으로 난이도가 올라갑니다." />
      {READING.length === 0 ? (
        <Card className="text-sm text-muted">독해 지문이 준비 중입니다.</Card>
      ) : (
        <ul className="grid gap-2">
          {READING.map((r) => (
            <li key={r.id}>
              <Link href={`/reading/${slugOf(r.id)}`}>
                <Card className="flex items-center gap-3 hover:border-brand/50">
                  <span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">{r.week}주</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium"><span lang="ja">{r.title}</span></span>
                    <span className="block text-xs text-muted">{r.level} · {r.body.length}자 · {r.questions.length}문제</span>
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
