import Link from "next/link";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { MockHistory } from "@/components/mock/mock-history";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK } from "@/data/mock";
import { slugOf } from "@/lib/plan";

export const metadata = { title: "모의고사" };

export default function MockList() {
  return (
    <>
      <PageHeader title="모의고사" description="8주차(11/26~)에 이틀에 한 번. 섹션별 제한 시간으로 실전 감각을 익히세요." />
      <div className="grid gap-2">
        {MOCK.map((m) => (
          <Link key={m.id} href={`/mock/${slugOf(m.id)}`}>
            <Card className="flex items-center gap-3 hover:border-brand/50">
              <span className="text-2xl">📝</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{m.title}</span>
                <span className="block text-xs text-muted">
                  {m.sections.reduce((a, s) => a + s.questions.length, 0)}문항 · {m.sections.reduce((a, s) => a + s.timeLimitMin, 0)}분 · {m.sections.map((s) => s.title.split(" ")[0]).join("/")}
                </span>
              </span>
              <span className="text-muted">›</span>
            </Card>
          </Link>
        ))}
        {MOCK.length === 0 && <Card className="text-sm text-muted">모의고사가 준비 중입니다.</Card>}
      </div>
      <Suspense fallback={null}>
        <ClientOnly>
          <MockHistory />
        </ClientOnly>
      </Suspense>
    </>
  );
}
