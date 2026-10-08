/**
 * 퀴즈 문항 생성기. 콘텐츠 풀에서 4지선다를 만든다.
 * 오답(distractor)은 같은 타입·가능하면 같은 품사/레벨에서 뽑아 변별력을 높인다.
 * 결정적 테스트를 위해 난수 생성기를 주입할 수 있다.
 */
import type { GrammarEntry, KanaEntry, KanjiEntry, VocabEntry } from "./content/types";
import type { QuizMode } from "./plan";

export interface QuizQuestion {
  id: string;
  mode: QuizMode | "mistakes";
  /** 문제 본문 (일본어는 UI 에서 lang=ja 처리) */
  prompt: string;
  /** 문제 아래 보조 텍스트 */
  sub?: string;
  /** TTS 로 읽어줄 텍스트 (청해 모드는 prompt 를 숨기고 이것만 재생) */
  speak?: string;
  choices: string[];
  answer: number;
  explanation?: string;
  /** 관련 콘텐츠 id (오답노트 연결) */
  refId: string;
  /** 선택지가 일본어인지 (폰트/lang 처리) */
  choicesJa: boolean;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 정답과 다른 값 3개를 후보에서 고른다 (prefer → fallback 순) */
function pickDistractors(correct: string, prefer: string[], fallback: string[], rng: Rng, n = 3): string[] {
  const out = new Set<string>();
  for (const pool of [prefer, fallback]) {
    for (const c of shuffle(pool, rng)) {
      if (out.size >= n) break;
      if (c !== correct && c.trim() && !out.has(c)) out.add(c);
    }
    if (out.size >= n) break;
  }
  return [...out];
}

function assemble(
  base: Omit<QuizQuestion, "choices" | "answer">,
  correct: string,
  distractors: string[],
  rng: Rng,
): QuizQuestion | undefined {
  if (distractors.length < 2) return undefined;
  const choices = shuffle([correct, ...distractors.slice(0, 3)], rng);
  return { ...base, choices, answer: choices.indexOf(correct) };
}

export interface Pools {
  kana: KanaEntry[];
  vocab: VocabEntry[];
  kanji: KanjiEntry[];
  grammar: GrammarEntry[];
}

/* ───────── 모드별 생성 ───────── */

export function kanaQuestion(target: KanaEntry, pool: KanaEntry[], rng: Rng): QuizQuestion | undefined {
  const sameScript = pool.filter((k) => k.script === target.script);
  const sameRow = sameScript.filter((k) => k.row === target.row || k.group === target.group).map((k) => k.romaji);
  const d = pickDistractors(target.romaji, sameRow, sameScript.map((k) => k.romaji), rng);
  return assemble(
    { id: `q-${target.id}`, mode: "kana", prompt: target.kana, speak: target.kana, refId: target.id, choicesJa: false, explanation: `${target.kana} = ${target.romaji}` },
    target.romaji,
    d,
    rng,
  );
}

export function vocabMeaningQuestion(target: VocabEntry, pool: VocabEntry[], rng: Rng): QuizQuestion | undefined {
  const correct = target.meanings[0];
  const samePos = pool.filter((v) => v.pos === target.pos && v.id !== target.id).map((v) => v.meanings[0]);
  const d = pickDistractors(correct, samePos, pool.map((v) => v.meanings[0]), rng);
  return assemble(
    {
      id: `q-${target.id}-m`,
      mode: "vocab-meaning",
      prompt: target.word,
      speak: target.reading,
      refId: target.id,
      choicesJa: false,
      explanation: `${target.word}（${target.reading}）: ${target.meanings.join(", ")}${target.examples?.[0] ? `\n${target.examples[0].ja} — ${target.examples[0].ko}` : ""}`,
    },
    correct,
    d,
    rng,
  );
}

export function vocabReadingQuestion(target: VocabEntry, pool: VocabEntry[], rng: Rng): QuizQuestion | undefined {
  if (target.word === target.reading) return undefined; // 가나 단어는 읽기 문제 불가
  const correct = target.reading;
  const sameLen = pool.filter((v) => v.id !== target.id && Math.abs(v.reading.length - correct.length) <= 1).map((v) => v.reading);
  const d = pickDistractors(correct, sameLen, pool.map((v) => v.reading), rng);
  return assemble(
    {
      id: `q-${target.id}-r`,
      mode: "vocab-reading",
      prompt: target.word,
      sub: target.meanings[0],
      refId: target.id,
      choicesJa: true,
      explanation: `${target.word} = ${target.reading} (${target.meanings.join(", ")})`,
    },
    correct,
    d,
    rng,
  );
}

export function kanjiReadingQuestion(target: KanjiEntry, pool: KanjiEntry[], rng: Rng): QuizQuestion | undefined {
  const w = target.words[Math.floor(rng() * target.words.length)];
  if (!w) return undefined;
  const correct = w.reading;
  const allReadings = pool.flatMap((k) => k.words.map((x) => x.reading));
  const similar = allReadings.filter((r) => Math.abs(r.length - correct.length) <= 1);
  const d = pickDistractors(correct, similar, allReadings, rng);
  return assemble(
    {
      id: `q-${target.id}-kr-${w.word}`,
      mode: "kanji-reading",
      prompt: w.word,
      sub: w.meaning,
      speak: w.reading,
      refId: target.id,
      choicesJa: true,
      explanation: `${w.word} = ${w.reading}。${target.char}: ${target.meanings.join(", ")} / 음독 ${target.on.join("・") || "-"} / 훈독 ${target.kun.join("・") || "-"}`,
    },
    correct,
    d,
    rng,
  );
}

export function kanjiMeaningQuestion(target: KanjiEntry, pool: KanjiEntry[], rng: Rng): QuizQuestion | undefined {
  const correct = target.meanings[0];
  const d = pickDistractors(correct, pool.filter((k) => k.level === target.level).map((k) => k.meanings[0]), pool.map((k) => k.meanings[0]), rng);
  return assemble(
    {
      id: `q-${target.id}-km`,
      mode: "kanji-meaning",
      prompt: target.char,
      refId: target.id,
      choicesJa: false,
      explanation: `${target.char}: ${target.meanings.join(", ")} · ${target.words.map((w) => `${w.word}(${w.reading})`).join(", ")}`,
    },
    correct,
    d,
    rng,
  );
}

export function grammarClozeQuestion(target: GrammarEntry, pool: GrammarEntry[], rng: Rng): QuizQuestion | undefined {
  const cloze = target.cloze?.[Math.floor(rng() * (target.cloze?.length ?? 0))];
  if (!cloze) return undefined;
  const d = pickDistractors(cloze.answer, cloze.distractors, pool.map((g) => g.pattern.replace(/^[〜～]/, "")), rng);
  return assemble(
    {
      id: `q-${target.id}-c-${cloze.sentence.slice(0, 6)}`,
      mode: "grammar-cloze",
      prompt: cloze.sentence,
      sub: cloze.ko,
      refId: target.id,
      choicesJa: true,
      explanation: `${target.pattern} — ${target.meaning}\n${target.explanation}`,
    },
    cloze.answer,
    d,
    rng,
  );
}

/** 청해: 예문을 듣고 뜻 고르기 (어휘·문법 예문 활용) */
export function listeningQuestion(target: VocabEntry | GrammarEntry, pool: (VocabEntry | GrammarEntry)[], rng: Rng): QuizQuestion | undefined {
  const ex = target.examples?.[0];
  if (!ex) return undefined;
  const others = pool.flatMap((p) => p.examples?.map((e) => e.ko) ?? []);
  const d = pickDistractors(ex.ko, others, others, rng);
  return assemble(
    {
      id: `q-${target.id}-l`,
      mode: "listening",
      prompt: ex.ja,
      speak: ex.ja,
      refId: target.id,
      choicesJa: false,
      explanation: `${ex.ja}\n${ex.ko}`,
    },
    ex.ko,
    d,
    rng,
  );
}

/* ───────── 세트 생성 ───────── */

export interface BuildOptions {
  mode: QuizMode | "mistakes";
  count: number;
  pools: Pools;
  /** 우선 출제할 콘텐츠 id (학습한 카드 / 오답). 비어 있으면 maxWeek 이하 전체 */
  preferIds?: Set<string>;
  /** 전체에서 뽑을 때 이 주차 이하만 */
  maxWeek?: number;
  rng?: Rng;
}

export function buildQuiz(opts: BuildOptions): QuizQuestion[] {
  const rng = opts.rng ?? Math.random;
  const { pools, mode, count } = opts;
  const maxWeek = opts.maxWeek ?? 9;
  const prefer = opts.preferIds ?? new Set<string>();

  const byPref = <T extends { id: string; week?: number }>(list: T[]) => {
    const p = list.filter((x) => prefer.has(x.id));
    const rest = list.filter((x) => !prefer.has(x.id) && (x.week ?? 1) <= maxWeek);
    return [...shuffle(p, rng), ...shuffle(rest, rng)];
  };

  const out: QuizQuestion[] = [];
  const seen = new Set<string>();
  const push = (q: QuizQuestion | undefined) => {
    if (q && !seen.has(q.refId)) {
      seen.add(q.refId);
      out.push(q);
    }
  };

  const gen = (m: QuizMode) => {
    switch (m) {
      case "kana":
        for (const k of byPref(pools.kana)) {
          if (out.length >= count) break;
          push(kanaQuestion(k, pools.kana, rng));
        }
        break;
      case "vocab-meaning":
        for (const v of byPref(pools.vocab)) {
          if (out.length >= count) break;
          push(vocabMeaningQuestion(v, pools.vocab, rng));
        }
        break;
      case "vocab-reading":
        for (const v of byPref(pools.vocab)) {
          if (out.length >= count) break;
          push(vocabReadingQuestion(v, pools.vocab, rng));
        }
        break;
      case "kanji-reading":
        for (const k of byPref(pools.kanji)) {
          if (out.length >= count) break;
          push(kanjiReadingQuestion(k, pools.kanji, rng));
        }
        break;
      case "kanji-meaning":
        for (const k of byPref(pools.kanji)) {
          if (out.length >= count) break;
          push(kanjiMeaningQuestion(k, pools.kanji, rng));
        }
        break;
      case "grammar-cloze":
        for (const g of byPref(pools.grammar)) {
          if (out.length >= count) break;
          push(grammarClozeQuestion(g, pools.grammar, rng));
        }
        break;
      case "listening": {
        const mixed = byPref<VocabEntry | GrammarEntry>([...pools.vocab, ...pools.grammar]).filter((x) => x.examples?.length);
        for (const x of mixed) {
          if (out.length >= count) break;
          push(listeningQuestion(x, mixed, rng));
        }
        break;
      }
    }
  };

  if (mode === "mistakes") {
    // 오답 콘텐츠의 타입에 맞는 모드로 각각 출제
    const ids = [...prefer];
    for (const id of shuffle(ids, rng)) {
      if (out.length >= count) break;
      const type = id.split(":")[0];
      let q: QuizQuestion | undefined;
      if (type === "vocab") {
        const v = pools.vocab.find((x) => x.id === id);
        if (v) q = rng() < 0.5 ? vocabMeaningQuestion(v, pools.vocab, rng) : (vocabReadingQuestion(v, pools.vocab, rng) ?? vocabMeaningQuestion(v, pools.vocab, rng));
      } else if (type === "kanji") {
        const k = pools.kanji.find((x) => x.id === id);
        if (k) q = kanjiReadingQuestion(k, pools.kanji, rng);
      } else if (type === "grammar") {
        const g = pools.grammar.find((x) => x.id === id);
        if (g) q = grammarClozeQuestion(g, pools.grammar, rng);
      } else if (type === "kana") {
        const k = pools.kana.find((x) => x.id === id);
        if (k) q = kanaQuestion(k, pools.kana, rng);
      }
      if (q) push({ ...q, mode: "mistakes" });
    }
    return out;
  }

  gen(mode);
  return out.slice(0, count);
}
