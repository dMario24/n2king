export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted md:inline-block">
      {children}
    </kbd>
  );
}
