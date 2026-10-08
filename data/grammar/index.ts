import type { GrammarEntry } from "@/lib/content/types";
import basicW1 from "./basic-w1";
import basicW2 from "./basic-w2";
import basicW3 from "./basic-w3";
import n2W4 from "./n2-w4";
import n2W5 from "./n2-w5";
import n2W6 from "./n2-w6";

/**
 * grammar 콘텐츠 모음. 파일을 추가하면 아래 배열에 spread 로 합친다.
 * 각 파일은 `export default [...] satisfies GrammarEntry[]` 형태.
 */
export const GRAMMAR: GrammarEntry[] = [...basicW1, ...basicW2, ...basicW3, ...n2W4, ...n2W5, ...n2W6];

export default GRAMMAR;
