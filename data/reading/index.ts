import type { ReadingPassage } from "@/lib/content/types";
import set01 from "./set-01";

/**
 * reading 콘텐츠 모음. 파일을 추가하면 아래 배열에 spread 로 합친다.
 * 각 파일은 `export default [...] satisfies ReadingPassage[]` 형태.
 */
export const READING: ReadingPassage[] = [...set01];

export default READING;
