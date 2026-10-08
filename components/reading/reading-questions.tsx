"use client";

import { useState } from "react";
import { MCQuestionView } from "@/components/content/mc-question";
import { Card } from "@/components/ui/card";
import type { ReadingPassage } from "@/lib/content/types";
import { nowMs, todayStr } from "@/lib/date";
import { logMistake, markTaskDone, recordQuiz } from "@/lib/db";

export function ReadingQuestions({ passage }: { passage: ReadingPassage }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const total = passage.questions.length;
  const answered = Object.keys(answers).length;
  const correct = passage.questions.filter((q) => answers[q.id] === q.answer).length;

  function choose(qid: string, i: number) {
    if (answers[qid] !== undefined) return;
    const q = passage.questions.find((x) => x.id === qid)!;
    const next = { ...answers, [qid]: i };
    setAnswers(next);
    if (i !== q.answer) {
      void logMistake({ id: `${passage.id}/${q.id}`, source: "reading", prompt: `[${passage.title}] ${q.prompt}`, correct: q.choices[q.answer], chosen: q.choices[i], explanation: q.explanation, ts: nowMs() });
    }
    if (Object.keys(next).length === total) {
      const c = passage.questions.filter((x) => next[x.id] === x.answer).length;
      void recordQuiz(todayStr(), c, total);
      void markTaskDone(todayStr(), "reading");
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold">문제 {answered}/{total}{answered === total && ` · 정답 ${correct}`}</h2>
      <div className="grid gap-5">
        {passage.questions.map((q, i) => (
          <MCQuestionView key={q.id} q={q} index={i} chosen={answers[q.id] ?? null} onChoose={(c) => choose(q.id, c)} revealed />
        ))}
      </div>
    </Card>
  );
}
