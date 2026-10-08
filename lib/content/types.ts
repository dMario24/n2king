/**
 * 학습 콘텐츠 타입 정의.
 * - 모든 콘텐츠는 레포의 data/ 아래 TS 파일로 큐레이션한다.
 * - id 는 `${type}:${slug}` 형식으로 전역 유일해야 한다 (tests/content.test.ts 가 검증).
 * - week 는 59일 커리큘럼의 주차(1~9). 플랜 생성기가 이 값으로 "이번 주 신규 풀"을 만든다.
 */

export type Level = "N5" | "N4" | "N3" | "N2";
export type ContentType = "kana" | "kanji" | "vocab" | "grammar" | "reading" | "listening" | "mock";
/** 1 = 핵심(반드시 학습), 2 = 중요, 3 = 여유 있을 때 */
export type Priority = 1 | 2 | 3;

export interface Example {
  ja: string;
  ko: string;
}

export interface KanaEntry {
  id: string; // kana:hi-a
  kana: string;
  romaji: string;
  script: "hiragana" | "katakana";
  group: "basic" | "dakuten" | "handakuten" | "youon";
  /** 행 (a, ka, sa ...) */
  row: string;
}

export type Pos =
  | "名" // 명사
  | "動1" // 1그룹(五段) 동사
  | "動2" // 2그룹(一段) 동사
  | "動3" // 3그룹(する/来る) 동사
  | "い形"
  | "な形"
  | "副" // 부사
  | "接" // 접속사
  | "連体" // 연체사
  | "助" // 조사/조동사
  | "表現" // 관용 표현
  | "他";

export interface VocabEntry {
  id: string; // vocab:w1-001
  word: string; // 표기 (한자 포함)
  reading: string; // 히라가나 읽기
  meanings: string[]; // 한국어 뜻 (1개 이상)
  pos: Pos;
  level: Level;
  week: number;
  priority: Priority;
  examples?: Example[];
  /** 포함된 한자 (kanji:char 참조용) */
  kanji?: string[];
  tags?: string[];
}

export interface KanjiEntry {
  id: string; // kanji:日
  char: string;
  meanings: string[]; // 한국어 훈/뜻 ("날 일" 처럼 훈음 표기)
  on: string[]; // 음독 (가타카나)
  kun: string[]; // 훈독 (히라가나, 오쿠리가나는 . 로 구분: た.べる)
  level: Level;
  week: number;
  priority: Priority;
  strokes?: number;
  /** 대표 단어 (읽기 퀴즈 출제용) */
  words: { word: string; reading: string; meaning: string }[];
}

export interface ClozeItem {
  /** 빈칸은 ___ 로 표기 */
  sentence: string;
  answer: string;
  distractors: string[]; // 3개 권장
  ko?: string;
}

export interface GrammarEntry {
  id: string; // grammar:n2-001
  pattern: string; // ～にもかかわらず
  meaning: string; // 한국어 뜻
  connection: string; // 접속 (동사 보통형 + ...)
  explanation: string; // 한국어 해설 (뉘앙스, 주의점)
  level: Level;
  week: number;
  priority: Priority;
  examples: Example[]; // 2개 이상 권장
  cloze?: ClozeItem[];
  /** 비교할 유사 문형 id */
  related?: string[];
}

export interface MCQuestion {
  id: string;
  prompt: string; // 문제 (일본어 지문/문장)
  choices: string[]; // 4지선다
  answer: number; // 정답 index
  explanation?: string; // 한국어 해설
}

export interface ReadingPassage {
  id: string; // reading:w4-01
  title: string;
  level: Level;
  week: number;
  /** 단락은 \n\n 으로 구분 */
  body: string;
  questions: MCQuestion[];
  vocabHints?: { word: string; reading: string; meaning: string }[];
}

export type ListeningKind = "task" | "point" | "summary" | "quick" | "integrated";

export interface ListeningScript {
  id: string; // listening:w5-01
  title: string;
  /** 과제이해 / 포인트이해 / 개요이해 / 즉시응답 / 통합이해 */
  kind: ListeningKind;
  week: number;
  lines: { speaker: "A" | "B" | "N"; ja: string; ko: string }[];
  questions: MCQuestion[];
}

export type MockSectionKind = "moji" | "goi" | "bunpou" | "dokkai" | "choukai";

export interface MockSection {
  kind: MockSectionKind;
  title: string;
  timeLimitMin: number;
  questions: MCQuestion[];
  /** 청해 섹션: 질문별 TTS 스크립트 (questions 와 같은 순서) */
  scripts?: string[];
}

export interface MockExam {
  id: string; // mock:01
  title: string;
  sections: MockSection[];
}

/** SRS 카드가 생성되는 콘텐츠 타입 */
export type CardContentType = Extract<ContentType, "kana" | "kanji" | "vocab" | "grammar">;

export const CARD_TYPES: CardContentType[] = ["kana", "vocab", "kanji", "grammar"];

export const TYPE_LABEL: Record<ContentType, string> = {
  kana: "가나",
  vocab: "어휘",
  kanji: "한자",
  grammar: "문법",
  reading: "독해",
  listening: "청해",
  mock: "모의고사",
};
