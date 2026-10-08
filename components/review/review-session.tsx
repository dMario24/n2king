"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { Jp } from "@/components/jp";
import { ItemDetail } from "@/components/content/item-detail";
import { SpeakButton } from "@/components/content/speak-button";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { ProgressBar } from "@/components/ui/progress";
import { frontText, getContentMaps, speechText, type CardItem } from "@/lib/content/lookup";
import { TYPE_LABEL, type CardContentType } from "@/lib/content/types";
import { nowMs, todayStr } from "@/lib/date";
import { getDb, logMistake, markTaskDone, recordReview, undoReview } from "@/lib/db";
import { useSettings } from "@/lib/db-hooks";
import { useHotkeys } from "@/lib/hotkeys";
import { GRADE_LABEL, previewIntervals, type Card as SrsCard, type Grade } from "@/lib/srs";
import { cancelSpeech, speak } from "@/lib/tts";

const GRADE_STYLE: Record<Grade, string> = {
  0: "bg-danger/15 text-danger hover:bg-danger/25",
  1: "bg-warning/15 text-warning hover:bg-warning/25",
  2: "bg-brand/15 text-brand hover:bg-brand/25",
  3: "bg-success/15 text-success hover:bg-success/25",
};

/**
 * SRS 복습 세션.
 * ?limit=N 으로 짧은 세션(모바일 짜투리), ?type=vocab 으로 타입 제한.
 * 세션 시작 시 만기 카드를 스냅샷으로 고정해 평가 도중 큐가 흔들리지 않게 한다.
 */
export function ReviewSession() {
  const params = useSearchParams();
  const limit = Number(params.get("limit")) || 0;
  const typeFilter = (params.get("type") as CardContentType | null) ?? undefined;
  const maps = use(getContentMaps());
  const settings = useSettings();

  const [queue, setQueue] = useState<SrsCard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [history, setHistory] = useState<{ prev: SrsCard; grade: Grade }[]>([]);
  const [remaining, setRemaining] = useState(0);
  const shownAt = useRef(0);

  // 세션 시작: 만기 카드 로드 (한 번)
  useEffect(() => {
    if (queue !== null) return;
    let cancelled = false;
    (async () => {
      const now = nowMs();
      const db = getDb();
      const coll = typeFilter ? db.cards.where("type").equals(typeFilter) : db.cards.toCollection();
      const due = (await coll.filter((c) => !c.suspended && c.due <= now).toArray()).sort((a, b) => a.due - b.due);
      if (cancelled) return;
      const picked = limit > 0 ? due.slice(0, limit) : due;
      setQueue(picked);
      setRemaining(due.length - picked.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [queue, limit, typeFilter]);

  const card = queue && idx < queue.length ? queue[idx] : undefined;
  const item: CardItem | undefined = card ? maps.find(card.id) : undefined;

  const [previewNow, setPreviewNow] = useState(0);
  const preview = useMemo(
    () => (card && previewNow ? previewIntervals(card, { now: previewNow, examDate: settings.examDate }) : undefined),
    [card, previewNow, settings.examDate],
  );

  // 카드가 바뀌면 타이머 리셋, 가나/어휘는 앞면에서 발음
  useEffect(() => {
    shownAt.current = nowMs();
  }, [card?.id]);

  useEffect(() => () => cancelSpeech(), []);

  // 세션 완료 시 오늘 '복습' 태스크 완료 표시 (남은 만기가 없을 때만)
  useEffect(() => {
    if (queue && idx >= queue.length && queue.length > 0 && remaining === 0) {
      void markTaskDone(todayStr(), "review");
    }
  }, [queue, idx, remaining]);

  async function grade(g: Grade) {
    if (!card || !item) return;
    const t = nowMs();
    const elapsed = t - shownAt.current;
    await recordReview(card, g, settings.examDate, t, elapsed);
    if (g === 0) {
      void logMistake({
        id: `${card.id}#review`,
        contentId: card.id,
        source: "review",
        prompt: frontText(item),
        correct: backSummary(item),
      });
    }
    setHistory((h) => [...h, { prev: card, grade: g }]);
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  async function undo() {
    const last = history.at(-1);
    if (!last) return;
    await undoReview(last.prev);
    setHistory((h) => h.slice(0, -1));
    setIdx((i) => Math.max(0, i - 1));
    setFlipped(false);
  }

  function flip() {
    if (!item) return;
    setFlipped((f) => {
      if (!f) {
        setPreviewNow(nowMs());
        void speak(speechText(item), { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
      }
      return !f;
    });
  }

  const hotkeys = useMemo(
    () => ({
      Space: () => (flipped ? undefined : flip()),
      Enter: () => (flipped ? grade(2) : flip()),
      "1": () => flipped && grade(0),
      "2": () => flipped && grade(1),
      "3": () => flipped && grade(2),
      "4": () => flipped && grade(3),
      z: () => undo(),
      s: () => item && speak(speechText(item), { rate: settings.ttsRate, voiceURI: settings.ttsVoice }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flipped, card?.id, history.length, settings],
  );
  useHotkeys(hotkeys);

  if (queue === null) return null;

  if (queue.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">지금 복습할 카드가 없어요 ✅</p>
        <p className="mt-1 text-sm text-muted">새 항목을 학습하면 10분 뒤부터 복습이 잡힙니다.</p>
        <div className="mt-4 flex justify-center gap-2">
          <LinkButton href="/learn">학습하러 가기</LinkButton>
          <LinkButton href="/quiz" variant="secondary">퀴즈로 점검</LinkButton>
        </div>
      </Card>
    );
  }

  if (!card || !item) {
    const again = history.filter((h) => h.grade === 0).length;
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">{queue.length}장 복습 완료 🎉</p>
        <p className="mt-1 text-sm text-muted">
          다시 {again} · 어려움 {history.filter((h) => h.grade === 1).length} · 알맞음 {history.filter((h) => h.grade === 2).length} · 쉬움{" "}
          {history.filter((h) => h.grade === 3).length}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {remaining > 0 && (
            <Button onClick={() => { setQueue(null); setIdx(0); setHistory([]); }}>
              남은 {remaining}장 계속
            </Button>
          )}
          <LinkButton href="/" variant={remaining > 0 ? "secondary" : "primary"}>홈으로</LinkButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          {TYPE_LABEL[card.type]} · {idx + 1} / {queue.length}
          {card.state === "new" || card.state === "learning" ? " · 학습 중" : card.state === "relearning" ? " · 재학습" : ` · ${card.interval}일 간격`}
        </span>
        <button type="button" onClick={undo} disabled={history.length === 0} className="disabled:opacity-40">
          ↶ 되돌리기 <Kbd>Z</Kbd>
        </button>
      </div>
      <ProgressBar value={idx} max={queue.length} className="mb-4" />

      <button
        type="button"
        onClick={flip}
        className="min-h-[46dvh] w-full rounded-3xl border border-border bg-surface p-6 text-left shadow-sm transition-transform active:scale-[0.99] md:min-h-80"
        aria-label={flipped ? "카드 뒷면" : "카드 앞면, 눌러서 뒤집기"}
      >
        {!flipped ? (
          <div className="flex h-full min-h-[40dvh] flex-col items-center justify-center md:min-h-72">
            <p className={`text-center font-bold ${frontText(item).length > 6 ? "text-3xl" : "text-6xl"}`}>
              <Jp>{frontText(item)}</Jp>
            </p>
            {item.type === "grammar" && <p className="mt-2 text-sm text-muted">뜻과 접속을 떠올려 보세요</p>}
            {item.type === "kanji" && <p className="mt-2 text-sm text-muted">뜻 · 음독 · 훈독을 떠올려 보세요</p>}
            <p className="mt-6 text-xs text-muted">탭해서 뒤집기 <Kbd>Space</Kbd></p>
          </div>
        ) : (
          <div>
            <ItemDetail card={item} compact={item.type !== "kana"} />
          </div>
        )}
      </button>

      <div className="mt-4">
        {!flipped ? (
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Button size="lg" onClick={flip}>
              정답 보기
            </Button>
            <SpeakButton text={speechText(item)} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {([0, 1, 2, 3] as Grade[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => grade(g)}
                className={`flex h-16 flex-col items-center justify-center rounded-2xl font-semibold transition-colors ${GRADE_STYLE[g]}`}
              >
                <span>{GRADE_LABEL[g]}</span>
                <span className="text-[11px] font-normal opacity-80">{preview?.[g]}</span>
                <Kbd>{g + 1}</Kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function backSummary(item: CardItem): string {
  switch (item.type) {
    case "kana":
      return item.item.romaji;
    case "vocab":
      return `${item.item.reading} · ${item.item.meanings.join(", ")}`;
    case "kanji":
      return item.item.meanings.join(", ");
    case "grammar":
      return item.item.meaning;
  }
}
