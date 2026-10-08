import type { KanjiEntry } from "@/lib/content/types";

/**
 * kanji 콘텐츠 모음. 파일을 추가하면 아래 배열에 spread 로 합친다.
 * 각 파일은 `export default [...] satisfies KanjiEntry[]` 형태.
 */
export const KANJI: KanjiEntry[] = [];

export default KANJI;
