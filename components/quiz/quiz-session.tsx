"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Jp } from "@/components/jp";
import { SpeakButton } from "@/components/content/speak-button";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { ProgressBar } from "@/components/ui/progress";
import { weekForDate } from "@/data/curriculum";
import { getContentMaps } from "@/lib/content/lookup";
import { nowMs, todayStr } from "@/lib/date";
import { getDb, logMistake, markTaskDone, recordQuiz, resolveMistake } from "@/lib/db";
import { useSettings } from "@/lib/db-hooks";
import { useHotkeys } from "@/lib/hotkeys";
import { QUIZ_MODE_LABEL, type QuizMode } from "@/lib/plan";
import { buildQuiz, type QuizQuestion } from "@/lib/quiz";
import { cancelSpeech, speak } from "@/lib/tts";

export type AnyMode = QuizMode | "mistakes";

/**
 * 퀴즈 세션. ?n=10|20 문항. 학습한 카드를 우선 출제하고, 부족하면 현재 주차 이하 전체에서 보충.
 * 오답은 오답노트에 기록되고, 오답 재시험(mistakes)에서 맞히면 해결 처리된다.
 */
export function QuizSession({ mode }: { mode: AnyMode }) {
  const params = useSearchParams();
  const count = Number(params.get("n")) || 10;
  const maps = use(getContentMaps());
  const settings = useSettings();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (questions !== null) return;
    let cancelled = false;
    (async () => {
      const db = getDb();
      let prefer: Set<string>;
      if (mode === "mistakes") {
        prefer = new Set((await db.mistakes.filter((m) => !m.resolvedAt && !!m.contentId).toArray()).map((m) => m.contentId!));
      } else {
        prefer = new Set((await db.cards.toCollection().primaryKeys()) as string[]);
      }
      if (cancelled) return;
      const week = weekForDate(todayStr())?.week ?? 9;
      const qs = buildQuiz({ mode, count, pools: maps.lists, preferIds: prefer, maxWeek: Math.max(week, 2) });
      setQuestions(qs);
    })();
    return () => {
      cancelled = true;
    };
  }, [questions, mode, count, maps]);

  const q = questions && idx < questions.length ? questions[idx] : undefined;
  const isListening = q?.mode === "listening";

  // 청해 문제는 등장 시 자동 재생
  useEffect(() => {
    if (q && isListening && q.speak) void speak(q.speak, { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
  }, [q, isListening, settings.ttsRate, settings.ttsVoice]);
  useEffect(() => () => cancelSpeech(), []);

  function choose(i: number) {
    if (!q || chosen !== null) return;
    const ok = i === q.answer;
    setChosen(i);
    setRevealed(true);
    setResults((r) => [...r, ok]);
    if (!ok) {
      void logMistake({
        id: q.id,
        contentId: q.refId,
        source: "quiz",
        prompt: q.prompt,
        correct: q.choices[q.answer],
        chosen: q.choices[i],
        explanation: q.explanation,
        ts: nowMs(),
      });
    } else if (mode === "mistakes") {
      void getDb()
        .mistakes.where("contentId")
        .equals(q.refId)
        .toArray()
        .then((rows) => Promise.all(rows.map((m) => resolveMistake(m.id))));
    }
  }

  function next() {
    if (!q || chosen === null) return;
    const isLast = idx + 1 >= (questions?.length ?? 0);
    if (isLast) {
      const correct = results.filter(Boolean).length;
      void recordQuiz(todayStr(), correct, results.length);
      void markTaskDone(todayStr(), "quiz");
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  }

  const hotkeys = useMemo(
    () => ({
      "1": () => choose(0),
      "2": () => choose(1),
      "3": () => choose(2),
      "4": () => choose(3),
      Enter: () => next(),
      Space: () => next(),
      r: () => q?.speak && speak(q.speak, { rate: settings.ttsRate, voiceURI: settings.ttsVoice }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q?.id, chosen, idx, settings],
  );
  useHotkeys(hotkeys);

  if (questions === null) return null;

  if (questions.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-semibold">출제할 문제가 없어요</p>
        <p className="mt-1 text-sm text-muted">
          {mode === "mistakes" ? "오답노트가 비어 있어요. 잘하고 있어요!" : "이 유형에 맞는 콘텐츠가 아직 없거나 예문이 필요해요."}
        </p>
        <LinkButton href="/quiz" variant="secondary" className="mt-4">다른 퀴즈</LinkButton>
      </Card>
    );
  }

  if (!q) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <Card className="text-center">
        <p className="text-sm text-muted">{QUIZ_LABEL(mode)}</p>
        <p className="mt-1 text-4xl font-black">{pct}%</p>
        <p className="mt-1 text-sm">{results.length}문제 중 {correct}개 정답</p>
        <p className="mt-2 text-xs text-muted">{pct >= 80 ? "좋아요! 이 범위는 안정적이에요." : pct >= 60 ? "틀린 문제는 오답노트에서 다시 확인하세요." : "복습을 더 돌리고 다시 도전해 보세요."}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => { setQuestions(null); setIdx(0); setResults([]); }}>한 번 더</Button>
          {correct < results.length && <LinkButton href="/mistakes" variant="secondary">오답노트</LinkButton>}
          <LinkButton href="/" variant="secondary">홈으로</LinkButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{QUIZ_LABEL(mode)} · {idx + 1} / {questions.length}</span>
        <span>정답 {results.filter(Boolean).length}</span>
      </div>
      <ProgressBar value={idx} max={questions.length} className="mb-4" />

      <Card className="min-h-40">
        {isListening && !revealed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <SpeakButton text={q.speak!} />
            <p className="text-sm text-muted">듣고 알맞은 뜻을 고르세요 <Kbd>R</Kbd> 다시 듣기</p>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-bold ${q.prompt.length > 12 ? "text-xl leading-relaxed" : "text-4xl"}`}>
                <Jp>{q.prompt}</Jp>
              </p>
              {q.sub && <p className="mt-1 text-sm text-muted">{q.sub}</p>}
            </div>
            {q.speak && <SpeakButton text={q.speak} size="sm" />}
          </div>
        )}
      </Card>

      <div className="mt-3 grid gap-2">
        {q.choices.map((c, i) => {
          let style = "border-border bg-surface hover:bg-surface-2";
          if (chosen !== null) {
            if (i === q.answer) style = "border-success bg-success/10";
            else if (i === chosen) style = "border-danger bg-danger/10";
            else style = "border-border opacity-60";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={chosen !== null}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${style}`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{i + 1}</span>
              <span className={q.choicesJa ? "text-lg" : ""}>{q.choicesJa ? <Jp>{c}</Jp> : c}</span>
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <div className="mt-3">
          <Card className={chosen === q.answer ? "border-success/40" : "border-danger/40"}>
            <p className="font-semibold">{chosen === q.answer ? "정답! 🎯" : "아쉬워요"}</p>
            {q.explanation && <p className="mt-1 whitespace-pre-line text-sm text-muted"><Jp>{q.explanation}</Jp></p>}
          </Card>
          <Button size="lg" className="mt-3 w-full" onClick={next}>
            {idx + 1 >= questions.length ? "결과 보기" : "다음"} <Kbd>Enter</Kbd>
          </Button>
        </div>
      )}
    </div>
  );
}

function QUIZ_LABEL(mode: AnyMode) {
  return mode === "mistakes" ? "오답 재시험" : QUIZ_MODE_LABEL[mode];
}
