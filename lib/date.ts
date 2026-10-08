/** 시험일 기본값과 날짜 유틸. 모두 로컬 타임존 기준 YYYY-MM-DD 문자열을 다룬다. */
export const EXAM_DATE_DEFAULT = "2026-12-06";
export const START_DATE_DEFAULT = "2026-10-08";

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(now: Date = new Date()): string {
  return toDateStr(now);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** a → b 까지 남은 일수 (b - a). 같은 날이면 0. */
export function daysBetween(a: string, b: string): number {
  const ms = parseDateStr(b).getTime() - parseDateStr(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** D-day 숫자. 시험 당일 0, 지나면 음수. */
export function dday(today: string, examDate: string = EXAM_DATE_DEFAULT): number {
  return daysBetween(today, examDate);
}

export function formatKoDate(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
}
