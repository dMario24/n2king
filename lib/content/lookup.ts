/** id → 콘텐츠 조회 맵. 한 번 로드해 캐시한다. */
import type { CardContentType, GrammarEntry, KanaEntry, KanjiEntry, VocabEntry } from "./types";
import { loadGrammar, loadKana, loadKanji, loadVocab } from "./registry";

export type CardItem =
  | { type: "kana"; item: KanaEntry }
  | { type: "vocab"; item: VocabEntry }
  | { type: "kanji"; item: KanjiEntry }
  | { type: "grammar"; item: GrammarEntry };

export interface ContentMaps {
  kana: Map<string, KanaEntry>;
  vocab: Map<string, VocabEntry>;
  kanji: Map<string, KanjiEntry>;
  grammar: Map<string, GrammarEntry>;
  lists: { kana: KanaEntry[]; vocab: VocabEntry[]; kanji: KanjiEntry[]; grammar: GrammarEntry[] };
  find(id: string): CardItem | undefined;
}

let cached: Promise<ContentMaps> | undefined;

export function getContentMaps(): Promise<ContentMaps> {
  if (!cached) {
    cached = Promise.all([loadKana(), loadVocab(), loadKanji(), loadGrammar()]).then(([kana, vocab, kanji, grammar]) => {
      const maps = {
        kana: new Map(kana.map((k) => [k.id, k])),
        vocab: new Map(vocab.map((v) => [v.id, v])),
        kanji: new Map(kanji.map((k) => [k.id, k])),
        grammar: new Map(grammar.map((g) => [g.id, g])),
      };
      const find = (id: string): CardItem | undefined => {
        const type = id.split(":")[0] as CardContentType;
        const item = maps[type]?.get(id);
        if (!item) return undefined;
        return { type, item } as CardItem;
      };
      return { ...maps, lists: { kana, vocab, kanji, grammar }, find };
    });
  }
  return cached;
}

/** 카드 앞면에 보여줄 짧은 텍스트 (TTS 에도 사용) */
export function frontText(c: CardItem): string {
  switch (c.type) {
    case "kana":
      return c.item.kana;
    case "vocab":
      return c.item.word;
    case "kanji":
      return c.item.char;
    case "grammar":
      return c.item.pattern;
  }
}

/** TTS 로 읽을 텍스트 */
export function speechText(c: CardItem): string {
  switch (c.type) {
    case "kana":
      return c.item.kana;
    case "vocab":
      return c.item.reading;
    case "kanji":
      return c.item.words[0]?.reading ?? c.item.char;
    case "grammar":
      return c.item.examples[0]?.ja ?? c.item.pattern;
  }
}
