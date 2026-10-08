"use client";

import { useEffect, useState } from "react";
import { Jp } from "@/components/jp";
import { MCQuestionView } from "@/components/content/mc-question";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ListeningScript } from "@/lib/content/types";
import { nowMs, todayStr } from "@/lib/date";
import { logMistake, markTaskDone, recordQuiz } from "@/lib/db";
import { useSettings } from "@/lib/db-hooks";
import { cancelSpeech, speakLines } from "@/lib/tts";

const KIND_LABEL = { task: "과제이해", point: "포인트이해", summary: "개요이해", quick: "즉시응답", integrated: "통합이해" } as const;

/** 청해: 대사를 TTS 로 재생(남/여 화자 구분 없이 순차), 답을 고른 뒤 스크립트와 번역 공개 */
export function ListeningPlayer({ script }: { script: ListeningScript }) {
  const settings = useSettings();
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const total = script.questions.length;
  const done = Object.keys(answers).length === total;

  useEffect(() => () => cancelSpeech(), []);

  async function play() {
    setPlaying(true);
    setPlays((n) => n + 1);
    await speakLines(script.lines.map((l) => ({ text: l.ja, speaker: l.speaker })), { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
    setPlaying(false);
  }

  function choose(qid: string, i: number) {
    if (answers[qid] !== undefined) return;
    const q = script.questions.find((x) => x.id === qid)!;
    const next = { ...answers, [qid]: i };
    setAnswers(next);
    if (i !== q.answer) {
      void logMistake({ id: `${script.id}/${q.id}`, source: "listening", prompt: `[${script.title}] ${q.prompt}`, correct: q.choices[q.answer], chosen: q.choices[i], explanation: q.explanation, ts: nowMs() });
    }
    if (Object.keys(next).length === total) {
      const c = script.questions.filter((x) => next[x.id] === x.answer).length;
      void recordQuiz(todayStr(), c, total);
      void markTaskDone(todayStr(), "listening");
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card className="text-center">
        <p className="text-xs text-muted">{KIND_LABEL[script.kind]} · {script.lines.length}줄</p>
        <Button size="lg" className="mt-3" onClick={play} disabled={playing}>
          {playing ? "재생 중…" : plays === 0 ? "▶ 듣기" : "↻ 다시 듣기"}
        </Button>
        {playing && (
          <Button size="sm" variant="ghost" className="ml-2" onClick={() => { cancelSpeech(); setPlaying(false); }}>
            중지
          </Button>
        )}
        <p className="mt-2 text-xs text-muted">실전처럼 1회 듣고 답한 뒤, 필요하면 다시 들어보세요. ({plays}회 재생)</p>
      </Card>

      <Card>
        <div className="grid gap-5">
          {script.questions.map((q, i) => (
            <MCQuestionView key={q.id} q={q} index={i} chosen={answers[q.id] ?? null} onChoose={(c) => choose(q.id, c)} revealed />
          ))}
        </div>
      </Card>

      {(done || plays >= 2) && (
        <details open={done} className="rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">스크립트 보기</summary>
          <ul className="mt-3 grid gap-2 text-sm">
            {script.lines.map((l, i) => (
              <li key={i} className={`rounded-xl p-2 ${l.speaker === "N" ? "bg-brand-soft" : "bg-surface-2"}`}>
                <span className="mr-2 text-xs text-muted">{l.speaker === "N" ? "질문" : l.speaker}</span>
                <Jp>{l.ja}</Jp>
                <span className="block text-xs text-muted">{l.ko}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
