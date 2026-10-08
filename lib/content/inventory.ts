/**
 * 플랜 생성기에 넘길 인벤토리(id/주차/우선순위)와 보조 콘텐츠 목록.
 * 모듈 레벨에서 한 번만 로드해 캐시한다 (React `use()` 로 소비).
 */
import type { CardContentType } from "./types";
import type { InventoryItem } from "../plan";
import { loadGrammar, loadKana, loadKanji, loadListening, loadMock, loadReading, loadVocab } from "./registry";

export interface Inventory {
  items: Record<CardContentType, InventoryItem[]>;
  readings: { id: string; week: number }[];
  listenings: { id: string; week: number }[];
  mocks: { id: string }[];
}

let cached: Promise<Inventory> | undefined;

export function getInventory(): Promise<Inventory> {
  if (!cached) {
    cached = Promise.all([loadKana(), loadVocab(), loadKanji(), loadGrammar(), loadReading(), loadListening(), loadMock()]).then(
      ([kana, vocab, kanji, grammar, reading, listening, mock]) => ({
        items: {
          kana: kana.map((k) => ({ id: k.id, week: 1, priority: 1 })),
          vocab: vocab.map((v) => ({ id: v.id, week: v.week, priority: v.priority })),
          kanji: kanji.map((k) => ({ id: k.id, week: k.week, priority: k.priority })),
          grammar: grammar.map((g) => ({ id: g.id, week: g.week, priority: g.priority })),
        },
        readings: reading.map((r) => ({ id: r.id, week: r.week })),
        listenings: listening.map((l) => ({ id: l.id, week: l.week })),
        mocks: mock.map((m) => ({ id: m.id })),
      }),
    );
  }
  return cached;
}
