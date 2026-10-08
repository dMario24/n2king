import type { ReactNode } from "react";

/** 일본어 텍스트 래퍼. lang="ja" 로 일본어 글리프와 TTS 언어 힌트를 보장한다. */
export function Jp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ja" className={className}>
      {children}
    </span>
  );
}

/** 후리가나 표시용 ruby. reading 이 없으면 본문만 출력한다. */
export function Ruby({ text, reading }: { text: string; reading?: string }) {
  if (!reading || reading === text) return <Jp>{text}</Jp>;
  return (
    <ruby lang="ja">
      {text}
      <rp>(</rp>
      <rt className="text-[0.6em] text-muted">{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
}
