/**
 * 59일 커리큘럼 (2026-10-08 ~ 2026-12-06).
 * 주차별 테마와 일일 신규 할당량. 플랜 생성기(lib/plan.ts)가 이 테이블을 소비한다.
 * newPerDay 는 "보통" 강도 기준이며, 설정에서 ±30% 조정된다.
 */
import type { CardContentType } from "@/lib/content/types";

export interface Week {
  week: number;
  start: string; // YYYY-MM-DD (포함)
  end: string; // YYYY-MM-DD (포함)
  title: string;
  theme: string;
  focus: string[];
  newPerDay: Record<CardContentType, number>;
  /** 이 주차에 열리는 보조 활동 */
  extras: ("kana-quiz" | "reading" | "listening" | "mock" | "mistakes")[];
  /** 신규 학습을 멈추고 복습만 하는 주 */
  reviewOnly?: boolean;
}

export const CURRICULUM: Week[] = [
  {
    week: 1, start: "2026-10-08", end: "2026-10-14",
    title: "가나 완성 + 기초 문법 시동",
    theme: "히라가나·가타카나를 100% 읽을 수 있게 만들고 です/ます 문장 구조를 익힌다.",
    focus: ["히라가나/가타카나 (탁음·요음 포함)", "です/ます, 조사 は·が·を·に·で", "인사·숫자·시간 표현", "기초 어휘 150"],
    newPerDay: { kana: 40, vocab: 20, kanji: 5, grammar: 2 },
    extras: ["kana-quiz"],
  },
  {
    week: 2, start: "2026-10-15", end: "2026-10-21",
    title: "N5–N4 압축 I: 활용의 뼈대",
    theme: "동사 3그룹과 て/た/ない형, 형용사 활용을 몸에 붙인다.",
    focus: ["동사 그룹 판별과 활용", "い/な형용사 활용", "て형 문형 (～ている/～てください/～てもいい)", "기초 어휘 250, 한자 80"],
    newPerDay: { kana: 0, vocab: 35, kanji: 12, grammar: 4 },
    extras: ["kana-quiz"],
  },
  {
    week: 3, start: "2026-10-22", end: "2026-10-28",
    title: "N4–N3 압축 II: 복문과 태",
    theme: "수수·수동·사역·조건·추량을 익혀 N2 문법을 받아들일 토대를 만든다.",
    focus: ["あげる/くれる/もらう", "수동·사역·사역수동", "조건 と/ば/たら/なら", "そう/よう/らしい/みたい", "경어 기초"],
    newPerDay: { kana: 0, vocab: 35, kanji: 14, grammar: 4 },
    extras: ["reading"],
  },
  {
    week: 4, start: "2026-10-29", end: "2026-11-04",
    title: "N2 문법 I + 어휘 가속",
    theme: "N2 문법 1/3을 시작하고 한자어 어휘를 집중적으로 늘린다.",
    focus: ["～に際して/～にあたって/～に先立って", "～ものだ/～ものか/～ものの", "～わけだ/～わけではない/～わけにはいかない", "N2 어휘 300, 한자 100"],
    newPerDay: { kana: 0, vocab: 40, kanji: 14, grammar: 6 },
    extras: ["reading", "listening"],
  },
  {
    week: 5, start: "2026-11-05", end: "2026-11-11",
    title: "N2 문법 II + 독해",
    theme: "N2 문법 2/3, 중문 독해로 문장 구조를 빠르게 파악하는 훈련을 시작한다.",
    focus: ["～ことだ/～ことに/～ことから", "～ばかりに/～だけに/～あまり", "～とともに/～につれて/～にしたがって", "독해: 주장 찾기, 지시어"],
    newPerDay: { kana: 0, vocab: 40, kanji: 14, grammar: 6 },
    extras: ["reading", "listening"],
  },
  {
    week: 6, start: "2026-11-12", end: "2026-11-18",
    title: "N2 문법 III + 청해",
    theme: "N2 문법을 마무리하고 청해 유형별 패턴(과제이해·포인트이해·즉시응답)에 익숙해진다.",
    focus: ["～ざるを得ない/～ないではいられない", "～にほかならない/～に相違ない", "～かねる/～かねない/～がたい", "청해 유형별 전략"],
    newPerDay: { kana: 0, vocab: 35, kanji: 12, grammar: 6 },
    extras: ["reading", "listening"],
  },
  {
    week: 7, start: "2026-11-19", end: "2026-11-25",
    title: "통합 복습 + 약점 집중",
    theme: "신규를 최소화하고 쌓인 복습과 오답을 처리한다. 유사 문형 비교로 문법 변별력을 올린다.",
    focus: ["SRS 복습 소화", "오답노트 재시험", "유사 문형 비교", "장문 독해"],
    newPerDay: { kana: 0, vocab: 20, kanji: 6, grammar: 2 },
    extras: ["reading", "listening", "mistakes"],
  },
  {
    week: 8, start: "2026-11-26", end: "2026-12-02",
    title: "모의고사 주간",
    theme: "실제 시간 배분(언어지식·독해 105분, 청해 50분)으로 모의고사를 치르고 오답을 재학습한다.",
    focus: ["모의고사 3회", "시간 배분 연습", "오답 재학습"],
    newPerDay: { kana: 0, vocab: 10, kanji: 0, grammar: 0 },
    extras: ["mock", "mistakes", "listening"],
  },
  {
    week: 9, start: "2026-12-03", end: "2026-12-06",
    title: "마무리",
    theme: "가벼운 복습만. 컨디션 관리와 시험 당일 체크리스트.",
    focus: ["핵심 문법 훑기", "오답노트 마지막 확인", "수험표·신분증·시계 준비"],
    newPerDay: { kana: 0, vocab: 0, kanji: 0, grammar: 0 },
    extras: ["mistakes"],
    reviewOnly: true,
  },
];

/** 신규 학습이 허용되는 마지막 날 (이후는 복습만) */
export const LAST_NEW_DAY = "2026-11-25";

export function weekForDate(date: string): Week | undefined {
  return CURRICULUM.find((w) => date >= w.start && date <= w.end);
}
