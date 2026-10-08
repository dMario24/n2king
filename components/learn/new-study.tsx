"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { ItemDetail } from "@/components/content/item-detail";
import { getInventory } from "@/lib/content/inventory";
import { getContentMaps, speechText } from "@/lib/content/lookup";
import { TYPE_LABEL, type CardContentType } from "@/lib/content/types";
import { todayStr } from "@/lib/date";
import { getDb, introduceCards, recordReview } from "@/lib/db";
import { useAllCards, useDaily, useNow, useSettings } from "@/lib/db-hooks";
import { generateDayPlan } from "@/lib/plan";
import { newCard } from "@/lib/srs";
import { speak } from "@/lib/tts";

/**
 * 오늘의 신규 학습 세션. 플랜 생성기가 고른 항목을 한 장씩 보여주고,
 * "알겠어요" → 카드 생성(10분 뒤 복습), "이미 알아요" → 카드 생성 + 쉬움 평가(5일 뒤).
 * 중간에 나가도 이미 본 항목은 카드가 생성되어 있어 진행이 보존된다.
 */
export function NewStudy({ type }: { type: CardContentType }) {
  const inventory = use(getInventory());
  const maps = use(getContentMaps());
  const now = useNow();
  const today = todayStr(new Date(now));
  const settings = useSettings();
  const cards = useAllCards();
  const daily = useDaily(today);
  const [ids, setIds] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  // 세션 시작 시점에 한 번만 오늘 분량을 확정한다 (카드가 생기면서 플랜이 바뀌지 않도록)
  useEffect(() => {
    if (ids !== null || cards === undefined) return;
    const plan = generateDayPlan({
      today,
      examDate: settings.examDate,
      intensity: settings.intensity,
      inventory: inventory.items,
      learned: new Set(cards.map((c) => c.id)),
      dueCount: 0,
      newDoneToday: daily?.newByType,
    });
    const task = plan.tasks.find((t) => t.kind === "new" && t.type === type);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 비동기 데이터 도착 후 1회 초기화
    setIds(task && task.kind === "new" ? task.ids : []);
  }, [ids, cards, today, settings, inventory, daily, type]);

  const current = ids && idx < ids.length ? maps.find(ids[idx]) : undefined;

  useEffect(() => {
    if (current && auto) void speak(speechText(current), { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
  }, [current, auto, settings.ttsRate, settings.ttsVoice]);

  if (ids === null || cards === undefined) return null;

  if (ids.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">오늘의 {TYPE_LABEL[type]} 신규 학습을 모두 마쳤어요 🎉</p>
        <p className="mt-1 text-sm text-muted">새로 추가된 카드는 10분 뒤부터 복습에 나타납니다.</p>
        <div className="mt-4 flex justify-center gap-2">
          <LinkButton href="/review">복습하러 가기</LinkButton>
          <LinkButton href={`/learn/${type}`} variant="secondary">목록 보기</LinkButton>
        </div>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">{ids.length}개 학습 완료 🎉</p>
        <p className="mt-1 text-sm text-muted">10분 뒤 첫 복습이 잡혀 있어요. 짧게 퀴즈로 바로 점검해도 좋아요.</p>
        <div className="mt-4 flex justify-center gap-2">
          <LinkButton href="/review">복습하러 가기</LinkButton>
          <LinkButton href="/">홈으로</LinkButton>
        </div>
      </Card>
    );
  }

  async function next(known: boolean) {
    const id = ids![idx];
    await introduceCards([id], type, Date.now());
    if (known) {
      const card = (await getDb().cards.get(id)) ?? newCard(id, type, Date.now());
      if (card.state === "new") await recordReview(card, 3, settings.examDate, Date.now());
    }
    setIdx((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>{TYPE_LABEL[type]} 신규 · {idx + 1} / {ids.length}</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> 자동 발음
        </label>
      </div>
      <ProgressBar value={idx} max={ids.length} className="mb-4" />
      <Card className="min-h-64">
        <ItemDetail card={current} />
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" onClick={() => next(true)}>
          이미 알아요
        </Button>
        <Button size="lg" onClick={() => next(false)}>
          알겠어요 →
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        <Link href={`/learn/${type}`} className="underline">목록으로</Link> · 나가도 본 항목은 저장돼요
      </p>
    </div>
  );
}
