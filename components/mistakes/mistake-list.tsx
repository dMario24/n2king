"use client";

import { useState } from "react";
import { Jp } from "@/components/jp";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveMistake } from "@/lib/db";
import { useMistakes } from "@/lib/db-hooks";

const SOURCE_LABEL = { quiz: "퀴즈", review: "복습", reading: "독해", listening: "청해", mock: "모의고사" } as const;

export function MistakeList() {
  const [showResolved, setShowResolved] = useState(false);
  const mistakes = useMistakes(!showResolved);
  if (!mistakes) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LinkButton href="/quiz/mistakes?n=20" size="sm">오답만 다시 풀기</LinkButton>
        <label className="ml-auto flex items-center gap-1 text-xs text-muted">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> 해결된 항목도 보기
        </label>
      </div>
      {mistakes.length === 0 ? (
        <Card className="text-center text-sm text-muted">오답이 없어요. 퀴즈와 복습에서 틀린 문제가 여기에 쌓입니다.</Card>
      ) : (
        <ul className="grid gap-2">
          {mistakes.map((m) => (
            <li key={m.id}>
              <Card className={`p-3 ${m.resolvedAt ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted">
                      {SOURCE_LABEL[m.source]} · {m.count}회 · {new Date(m.lastTs).toLocaleDateString("ko-KR")}
                    </p>
                    <p className="mt-0.5 font-medium"><Jp>{m.prompt}</Jp></p>
                    <p className="mt-1 text-sm">
                      <span className="text-success">정답: <Jp>{m.correct}</Jp></span>
                      {m.chosen && <span className="ml-3 text-danger">내 답: <Jp>{m.chosen}</Jp></span>}
                    </p>
                    {m.explanation && <p className="mt-1 whitespace-pre-line text-xs text-muted"><Jp>{m.explanation}</Jp></p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => resolveMistake(m.id, !m.resolvedAt)}>
                    {m.resolvedAt ? "되돌리기" : "해결 ✓"}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
