export function ProgressBar({
  value,
  max,
  className = "",
  color = "bg-brand",
}: {
  value: number;
  max: number;
  className?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** 여러 구간(정착/익히는 중/학습 중)을 한 바에 쌓아 보여준다 */
export function StackedBar({ segments, total }: { segments: { value: number; color: string; label: string }[]; total: number }) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
      {segments.map((s) => (
        <div key={s.label} className={`h-full ${s.color}`} style={{ width: total ? `${(s.value / total) * 100}%` : 0 }} title={`${s.label} ${s.value}`} />
      ))}
    </div>
  );
}
