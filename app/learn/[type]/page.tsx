import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { ItemList } from "@/components/learn/item-list";
import { ModeSwitch } from "@/components/learn/mode-switch";
import { NewStudy } from "@/components/learn/new-study";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { TYPE_LABEL } from "@/lib/content/types";

const TYPES = ["vocab", "kanji", "grammar"] as const;
type T = (typeof TYPES)[number];

const DESC: Record<T, string> = {
  vocab: "기초 어휘(1~3주) → N2 핵심 어휘(4~8주)",
  kanji: "N5 → N2 한자. 음독·훈독·대표 단어",
  grammar: "기초 활용(1~3주) → N2 문형(4~6주). 접속·뉘앙스·빈칸",
};

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

/** params 는 Suspense 안의 자식에서 await 해야 내비게이션이 즉시(instant) 유지된다 */
export default function LearnTypePage({ params }: PageProps<"/learn/[type]">) {
  return (
    <Suspense fallback={<CardSkeleton lines={8} />}>
      <LearnTypeContent params={params} />
    </Suspense>
  );
}

async function LearnTypeContent({ params }: { params: PageProps<"/learn/[type]">["params"] }) {
  const { type } = await params;
  if (!TYPES.includes(type as T)) notFound();
  const t = type as T;
  return (
    <>
      <PageHeader title={TYPE_LABEL[t]} description={DESC[t]} />
      <Suspense fallback={<CardSkeleton lines={8} />}>
        <ClientOnly>
          <ModeSwitch newMode={<NewStudy type={t} />} listMode={<ItemList type={t} />} newHref={`/learn/${t}?mode=new`} />
        </ClientOnly>
      </Suspense>
    </>
  );
}
