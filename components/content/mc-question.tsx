"use client";

import { Jp } from "@/components/jp";
import type { MCQuestion } from "@/lib/content/types";

/**
 * 4지선다 문항. revealed=false 면 선택만 받고(모의고사), true 면 선택 즉시 정오·해설 표시(독해/청해).
 */
export function MCQuestionView({
  q,
  index,
  chosen,
  onChoose,
  revealed,
  choicesJa = true,
}: {
  q: MCQuestion;
  index?: number;
  chosen: number | null;
  onChoose: (i: number) => void;
  revealed: boolean;
  choicesJa?: boolean;
}) {
  return (
    <div>
      <p className="whitespace-pre-line font-medium leading-relaxed">
        {index !== undefined && <span className="mr-2 text-muted">{index + 1}.</span>}
        <Jp>{q.prompt}</Jp>
      </p>
      <div className="mt-2 grid gap-2">
        {q.choices.map((c, i) => {
          let style = "border-border bg-surface hover:bg-surface-2";
          if (chosen !== null && revealed) {
            if (i === q.answer) style = "border-success bg-success/10";
            else if (i === chosen) style = "border-danger bg-danger/10";
            else style = "border-border opacity-60";
          } else if (chosen === i) {
            style = "border-brand bg-brand-soft";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={revealed && chosen !== null}
              onClick={() => onChoose(i)}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${style}`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{i + 1}</span>
              {choicesJa ? <Jp>{c}</Jp> : c}
            </button>
          );
        })}
      </div>
      {revealed && chosen !== null && q.explanation && (
        <p className={`mt-2 rounded-xl p-3 text-sm ${chosen === q.answer ? "bg-success/10" : "bg-danger/10"}`}>
          {chosen === q.answer ? "정답 🎯 " : "오답 · "}
          <Jp>{q.explanation}</Jp>
        </p>
      )}
    </div>
  );
}
