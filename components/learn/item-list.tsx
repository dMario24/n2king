"use client";

import { use, useMemo, useState } from "react";
import { Jp } from "@/components/jp";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ItemDetail } from "@/components/content/item-detail";
import { CURRICULUM } from "@/data/curriculum";
import { getContentMaps, type CardItem } from "@/lib/content/lookup";

type ListItem = Exclude<CardItem, { type: "kana" }>;
import { TYPE_LABEL, type CardContentType } from "@/lib/content/types";
import { introduceCards, setSuspended } from "@/lib/db";
import { useCardsByType } from "@/lib/db-hooks";
import { MASTERY_LABEL, masteryOf, type Mastery } from "@/lib/srs";

const MASTERY_DOT: Record<Mastery, string> = {
  unseen: "bg-border",
  learning: "bg-warning",
  young: "bg-brand",
  mature: "bg-success",
};

type Filter = "all" | Mastery;

/** 어휘/한자/문법 목록: 주차별 그룹, 검색, 숙련도 필터, 상세 보기 */
export function ItemList({ type }: { type: Exclude<CardContentType, "kana"> }) {
  const maps = use(getContentMaps());
  const cards = useCardsByType(type);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [week, setWeek] = useState<number | 0>(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const cardMap = useMemo(() => new Map((cards ?? []).map((c) => [c.id, c])), [cards]);
  const items: ListItem[] = useMemo(
    () => maps.lists[type].map((item) => ({ type, item }) as ListItem),
    [maps, type],
  );

  const filtered = items.filter((c) => {
    if (week && c.item.week !== week) return false;
    if (filter !== "all" && masteryOf(cardMap.get(c.item.id)) !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    const hay =
      c.type === "vocab"
        ? [c.item.word, c.item.reading, ...c.item.meanings]
        : c.type === "kanji"
          ? [c.item.char, ...c.item.meanings, ...c.item.on, ...c.item.kun]
          : [c.item.pattern, c.item.meaning];
    return hay.some((h) => h.toLowerCase().includes(s));
  });

  const open = openId ? maps.find(openId) : undefined;
  const openCard = openId ? cardMap.get(openId) : undefined;
  const counts = { total: items.length, started: items.filter((c) => cardMap.has(c.item.id)).length };

  if (cards === undefined) return null;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${TYPE_LABEL[type]} 검색 (일본어/뜻)`}
            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
          />
          <select value={week} onChange={(e) => setWeek(Number(e.target.value))} className="h-10 rounded-xl border border-border bg-surface px-2 text-sm">
            <option value={0}>전체 주차</option>
            {CURRICULUM.filter((w) => items.some((c) => c.item.week === w.week)).map((w) => (
              <option key={w.week} value={w.week}>{w.week}주차</option>
            ))}
          </select>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
          {(["all", "unseen", "learning", "young", "mature"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 ${filter === f ? "border-brand bg-brand-soft text-brand" : "border-border text-muted"}`}
            >
              {f === "all" ? `전체 ${counts.total}` : MASTERY_LABEL[f]}
            </button>
          ))}
          <span className="ml-auto self-center text-muted">학습 시작 {counts.started}/{counts.total}</span>
        </div>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {filtered.slice(0, 400).map((c) => {
            const m = masteryOf(cardMap.get(c.item.id));
            const i = c.item;
            return (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(i.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 ${openId === i.id ? "bg-brand-soft" : ""}`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${MASTERY_DOT[m]}`} title={MASTERY_LABEL[m]} />
                  {c.type === "vocab" && (
                    <>
                      <span className="w-28 shrink-0 truncate font-medium"><Jp>{c.item.word}</Jp></span>
                      <span className="w-24 shrink-0 truncate text-xs text-muted"><Jp>{c.item.reading}</Jp></span>
                      <span className="flex-1 truncate text-sm">{c.item.meanings.join(", ")}</span>
                    </>
                  )}
                  {c.type === "kanji" && (
                    <>
                      <span className="w-10 shrink-0 text-2xl font-medium"><Jp>{c.item.char}</Jp></span>
                      <span className="flex-1 truncate text-sm">{c.item.meanings[0]}</span>
                      <span className="truncate text-xs text-muted"><Jp>{[...c.item.on, ...c.item.kun].slice(0, 3).join("・")}</Jp></span>
                    </>
                  )}
                  {c.type === "grammar" && (
                    <>
                      <span className="w-40 shrink-0 truncate font-medium"><Jp>{c.item.pattern}</Jp></span>
                      <span className="flex-1 truncate text-sm">{c.item.meaning}</span>
                    </>
                  )}
                  <span className="shrink-0 text-[10px] text-muted">{i.week}주</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="p-6 text-center text-sm text-muted">결과가 없어요.</li>}
        </ul>
        {filtered.length > 400 && <p className="mt-2 text-xs text-muted">검색어나 주차로 좁혀 보세요 (400개까지 표시).</p>}
      </div>

      {/* 상세: 데스크톱은 우측 패널, 모바일은 하단 시트 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 md:static md:block md:bg-transparent" onClick={() => setOpenId(null)}>
          <Card className="max-h-[85dvh] w-full overflow-y-auto rounded-b-none md:sticky md:top-6 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>{MASTERY_LABEL[masteryOf(openCard)]}{openCard ? ` · 복습 ${openCard.reps}회` : ""}</span>
              <button type="button" onClick={() => setOpenId(null)} className="rounded-md px-2 py-1 hover:bg-surface-2">닫기 ✕</button>
            </div>
            <ItemDetail card={open} />
            <div className="mt-4 flex gap-2">
              {!openCard ? (
                <Button className="flex-1" onClick={() => introduceCards([open.item.id], type)}>
                  학습 시작 (카드 추가)
                </Button>
              ) : (
                <Button variant="secondary" className="flex-1" onClick={() => setSuspended(open.item.id, !openCard.suspended)}>
                  {openCard.suspended ? "복습 재개" : "복습 일시중지"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
      {!open && (
        <div className="hidden md:block">
          <Card className="sticky top-6 text-sm text-muted">
            <p>항목을 선택하면 상세가 여기에 표시됩니다.</p>
            <LinkButton href={`/learn/${type}?mode=new`} className="mt-4 w-full">오늘의 신규 학습 시작</LinkButton>
          </Card>
        </div>
      )}
    </div>
  );
}
