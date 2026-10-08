import type { KanjiEntry } from "@/lib/content/types";
import w1 from "./w1";
import w2 from "./w2";
import w3 from "./w3";
import w4 from "./w4";
import w5 from "./w5";
import w6 from "./w6";

/**
 * kanji 콘텐츠 모음. 파일을 추가하면 아래 배열에 spread 로 합친다.
 * 각 파일은 `export default [...] satisfies KanjiEntry[]` 형태.
 */
export const KANJI: KanjiEntry[] = [...w1, ...w2, ...w3, ...w4, ...w5, ...w6];

export default KANJI;
