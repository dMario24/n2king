"use client";

import { useEffect, useState } from "react";
import { Jp } from "@/components/jp";
import { MCQuestionView } from "@/components/content/mc-question";
import { SpeakButton } from "@/components/content/speak-button";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import type { MockExam, MockSection } from "@/lib/content/types";
import { nowMs, todayStr } from "@/lib/date";
import { logMistake, markTaskDone, recordQuiz, saveMockResult } from "@/lib/db";
import { formatMMSS } from "@/lib/focus";

const KIND_LABEL: Record<MockSection["kind"], string> = { moji: "문자", goi: "어휘", bunpou: "문법", dokkai: "독해", choukai: "청해" };

type Phase = { step: "intro" } | { step: "section"; i: number; startedAt: number } | { step: "result" };

/**
 * 모의고사: 섹션별 제한 시간(카운트다운) 안에 전 문항을 풀고 제출. 시간이 끝나면 자동 제출.
 * 청해 섹션은 문항별 스크립트를 TTS 로 재생. 종료 후 섹션별 점수와 오답 복기, 결과 저장.
 */
export function MockRunner({ exam }: { exam: MockExam }) {
  const [phase, setPhase] = useState<Phase>({ step: "intro" });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [now, setNow] = useState(0);
  const [results, setResults] = useState<{ sections: { kind: string; title: string; correct: number; total: number }[]; correct: number; total: number } | null>(null);

  const section = phase.step === "section" ? exam.sections[phase.i] : undefined;

  useEffect(() => {
    if (phase.step !== "section") return;
    const id = setInterval(() => setNow(nowMs()), 500);
    return () => clearInterval(id);
  }, [phase]);

  const remaining = phase.step === "section" && section ? phase.startedAt + section.timeLimitMin * 60_000 - (now || phase.startedAt) : 0;

  // 시간 종료 → 자동 제출
  useEffect(() => {
    if (phase.step === "section" && now && remaining <= 0) submitSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase.step, now]);

  function finish(finalAnswers: Record<string, number>) {
    const sections = exam.sections.map((s) => ({
      kind: s.kind,
      title: s.title,
      correct: s.questions.filter((q) => finalAnswers[q.id] === q.answer).length,
      total: s.questions.length,
    }));
    const correct = sections.reduce((a, s) => a + s.correct, 0);
    const total = sections.reduce((a, s) => a + s.total, 0);
    setResults({ sections, correct, total });
    setPhase({ step: "result" });
    void saveMockResult({ mockId: exam.id, ts: nowMs(), sections: sections.map(({ kind, correct, total }) => ({ kind, correct, total })), correct, total });
    void recordQuiz(todayStr(), correct, total);
    void markTaskDone(todayStr(), "mock");
    for (const s of exam.sections)
      for (const q of s.questions)
        if (finalAnswers[q.id] !== q.answer)
          void logMistake({
            id: `${exam.id}/${q.id}`,
            source: "mock",
            prompt: `[${exam.title} ${s.title}] ${q.prompt.slice(0, 80)}`,
            correct: q.choices[q.answer],
            chosen: finalAnswers[q.id] !== undefined ? q.choices[finalAnswers[q.id]] : undefined,
            explanation: q.explanation,
            ts: nowMs(),
          });
  }

  function startSection(i: number) {
    setPhase({ step: "section", i, startedAt: nowMs() });
    window.scrollTo({ top: 0 });
  }

  function submitSection() {
    if (phase.step !== "section") return;
    const next = phase.i + 1;
    if (next < exam.sections.length) startSection(next);
    else finish(answers);
  }

  if (phase.step === "intro") {
    const totalMin = exam.sections.reduce((a, s) => a + s.timeLimitMin, 0);
    const totalQ = exam.sections.reduce((a, s) => a + s.questions.length, 0);
    return (
      <Card className="mx-auto max-w-xl">
        <p className="text-sm text-muted">총 {totalQ}문항 · {totalMin}분 (실전 축소판)</p>
        <ul className="mt-3 divide-y divide-border text-sm">
          {exam.sections.map((s) => (
            <li key={s.kind} className="flex justify-between py-2">
              <span>{s.title}</span>
              <span className="text-muted">{s.questions.length}문항 · {s.timeLimitMin}분</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          섹션마다 제한 시간이 있고 끝나면 자동 제출됩니다. 중간에 페이지를 떠나면 진행이 사라지니 한 번에 끝낼 수 있을 때 시작하세요.
          청해는 소리가 나므로 이어폰을 준비하세요.
        </p>
        <Button size="lg" className="mt-4 w-full" onClick={() => startSection(0)}>시작</Button>
      </Card>
    );
  }

  if (phase.step === "result" && results) {
    const pct = Math.round((results.correct / results.total) * 100);
    return (
      <div className="mx-auto grid max-w-2xl gap-4">
        <Card className="text-center">
          <p className="text-sm text-muted">{exam.title} 결과</p>
          <p className="my-1 text-5xl font-black">{pct}%</p>
          <p className="text-sm">{results.correct} / {results.total} 정답</p>
          <p className="mt-2 text-xs text-muted">
            {pct >= 70 ? "합격권이에요. 틀린 유형만 보강하세요." : pct >= 55 ? "합격선 근처. 오답 유형을 집중 복습하세요." : "아직 기초가 흔들려요. 문법·어휘 복습 비중을 늘리세요."}
            {" "}(실제 N2 합격선은 180점 만점에 90점, 과목별 19점 이상)
          </p>
          <ul className="mt-3 grid grid-cols-5 gap-1 text-xs">
            {results.sections.map((s) => (
              <li key={s.kind} className={`rounded-lg p-2 ${s.correct / s.total >= 0.6 ? "bg-success/10" : "bg-danger/10"}`}>
                <span className="block text-muted">{KIND_LABEL[s.kind as MockSection["kind"]]}</span>
                <span className="font-semibold">{s.correct}/{s.total}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-center gap-2">
            <LinkButton href="/mistakes" variant="secondary">오답노트</LinkButton>
            <LinkButton href="/">홈으로</LinkButton>
          </div>
        </Card>
        {exam.sections.map((s) => (
          <Card key={s.kind}>
            <h2 className="mb-3 font-semibold">{s.title} 복기</h2>
            <div className="grid gap-5">
              {s.questions.map((q, i) => (
                <div key={q.id}>
                  {s.scripts?.[i] && (
                    <details className="mb-2 text-xs">
                      <summary className="cursor-pointer text-muted">스크립트</summary>
                      <p className="mt-1 whitespace-pre-line rounded-lg bg-surface-2 p-2"><Jp>{s.scripts[i]}</Jp></p>
                    </details>
                  )}
                  <MCQuestionView q={q} index={i} chosen={answers[q.id] ?? null} onChoose={() => {}} revealed />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!section || phase.step !== "section") return null;
  const answered = section.questions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:mx-0 md:rounded-xl md:border">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{phase.i + 1}/{exam.sections.length} · {section.title}</span>
          <span className={`font-mono text-lg font-bold tabular-nums ${remaining < 60_000 ? "text-danger" : ""}`}>{formatMMSS(remaining)}</span>
        </div>
        <ProgressBar value={answered} max={section.questions.length} className="mt-1" />
      </div>

      <div className="grid gap-6">
        {section.questions.map((q, i) => (
          <Card key={q.id}>
            {section.kind === "choukai" && section.scripts?.[i] && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3 text-sm">
                <SpeakButton text={section.scripts[i].replace(/^(男|女|N|ナレーター)：/gm, "")} />
                <span className="text-muted">재생 버튼을 눌러 대화를 들으세요 (실전처럼 1회 권장)</span>
              </div>
            )}
            <MCQuestionView q={q} index={i} chosen={answers[q.id] ?? null} onChoose={(c) => setAnswers((a) => ({ ...a, [q.id]: c }))} revealed={false} />
          </Card>
        ))}
      </div>
      <Button size="lg" className="mt-6 w-full" onClick={submitSection}>
        {answered < section.questions.length ? `제출 (${section.questions.length - answered}문항 미답)` : phase.i + 1 < exam.sections.length ? "제출하고 다음 섹션" : "제출하고 결과 보기"}
      </Button>
    </div>
  );
}
