import type { VocabEntry } from "@/lib/content/types";
import basicW1 from "./basic-w1";
import basicW2 from "./basic-w2";
import basicW3 from "./basic-w3";
import n2w4 from "./n2-w4";
import n2w5 from "./n2-w5";
import n2w6 from "./n2-w6";
import n2w7 from "./n2-w7";
import n2w8 from "./n2-w8";

/**
 * vocab 콘텐츠 모음. 파일을 추가하면 아래 배열에 spread 로 합친다.
 * 각 파일은 `export default [...] satisfies VocabEntry[]` 형태.
 */
export const VOCAB: VocabEntry[] = [...basicW1, ...basicW2, ...basicW3, ...n2w4, ...n2w5, ...n2w6, ...n2w7, ...n2w8];

export default VOCAB;
