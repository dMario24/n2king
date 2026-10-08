import { Jp, Ruby } from "@/components/jp";
import type { CardItem } from "@/lib/content/lookup";
import type { GrammarEntry, KanaEntry, KanjiEntry, VocabEntry } from "@/lib/content/types";
import { SpeakButton } from "./speak-button";

/** 카드 뒷면/상세 시트에서 쓰는 타입별 상세 뷰 */
export function ItemDetail({ card, compact = false }: { card: CardItem; compact?: boolean }) {
  switch (card.type) {
    case "kana":
      return <KanaDetail item={card.item} />;
    case "vocab":
      return <VocabDetail item={card.item} compact={compact} />;
    case "kanji":
      return <KanjiDetail item={card.item} compact={compact} />;
    case "grammar":
      return <GrammarDetail item={card.item} compact={compact} />;
  }
}

export function KanaDetail({ item }: { item: KanaEntry }) {
  return (
    <div className="text-center">
      <p className="text-7xl font-bold"><Jp>{item.kana}</Jp></p>
      <p className="mt-2 text-2xl text-muted">{item.romaji}</p>
      <p className="mt-1 text-xs text-muted">{item.script === "hiragana" ? "히라가나" : "가타카나"} · {item.row}행</p>
      <SpeakButton text={item.kana} className="mt-3" />
    </div>
  );
}

export function VocabDetail({ item, compact }: { item: VocabEntry; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold"><Ruby text={item.word} reading={item.reading} /></p>
          <p className="mt-1 text-sm text-muted"><Jp>{item.reading}</Jp> · {item.pos} · {item.level}</p>
        </div>
        <SpeakButton text={item.reading} />
      </div>
      <p className="mt-3 text-lg font-medium">{item.meanings.join(", ")}</p>
      {!compact && item.examples?.map((ex, i) => (
        <div key={i} className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <p className="flex items-center justify-between gap-2">
            <Jp>{ex.ja}</Jp>
            <SpeakButton text={ex.ja} size="sm" />
          </p>
          <p className="mt-1 text-muted">{ex.ko}</p>
        </div>
      ))}
    </div>
  );
}

export function KanjiDetail({ item, compact }: { item: KanjiEntry; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <p className="text-7xl font-bold leading-none"><Jp>{item.char}</Jp></p>
        <div className="flex-1 text-sm">
          <p className="text-lg font-semibold">{item.meanings.join(", ")}</p>
          {item.on.length > 0 && <p className="mt-1"><span className="text-muted">음독</span> <Jp>{item.on.join("・")}</Jp></p>}
          {item.kun.length > 0 && <p><span className="text-muted">훈독</span> <Jp>{item.kun.join("・")}</Jp></p>}
          <p className="mt-1 text-xs text-muted">{item.level}{item.strokes ? ` · ${item.strokes}획` : ""}</p>
        </div>
      </div>
      {!compact && (
        <ul className="mt-3 grid gap-2">
          {item.words.map((w) => (
            <li key={w.word} className="flex items-center justify-between rounded-xl bg-surface-2 p-3 text-sm">
              <span>
                <Ruby text={w.word} reading={w.reading} /> <span className="ml-2 text-muted">{w.meaning}</span>
              </span>
              <SpeakButton text={w.reading} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GrammarDetail({ item, compact }: { item: GrammarEntry; compact?: boolean }) {
  return (
    <div>
      <p className="text-2xl font-bold"><Jp>{item.pattern}</Jp></p>
      <p className="mt-1 text-lg font-medium">{item.meaning}</p>
      <p className="mt-2 text-xs text-muted">접속: <Jp>{item.connection}</Jp> · {item.level}</p>
      {!compact && <p className="mt-3 text-sm leading-relaxed">{item.explanation}</p>}
      <div className="mt-3 grid gap-2">
        {(compact ? item.examples.slice(0, 1) : item.examples).map((ex, i) => (
          <div key={i} className="rounded-xl bg-surface-2 p-3 text-sm">
            <p className="flex items-center justify-between gap-2">
              <Jp>{ex.ja}</Jp>
              <SpeakButton text={ex.ja} size="sm" />
            </p>
            <p className="mt-1 text-muted">{ex.ko}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
