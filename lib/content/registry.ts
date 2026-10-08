/**
 * 콘텐츠 로더. 페이지 번들을 가볍게 유지하기 위해 타입별로 동적 import 한다.
 * 서버 컴포넌트에서 정적 목록을 그릴 때는 data/* 를 직접 import 해도 된다.
 */
export const loadKana = () => import("@/data/kana").then((m) => m.KANA);
export const loadVocab = () => import("@/data/vocab").then((m) => m.VOCAB);
export const loadKanji = () => import("@/data/kanji").then((m) => m.KANJI);
export const loadGrammar = () => import("@/data/grammar").then((m) => m.GRAMMAR);
export const loadReading = () => import("@/data/reading").then((m) => m.READING);
export const loadListening = () => import("@/data/listening").then((m) => m.LISTENING);
export const loadMock = () => import("@/data/mock").then((m) => m.MOCK);
