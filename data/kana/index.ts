import type { KanaEntry } from "@/lib/content/types";

/** [romaji, hiragana, katakana] */
type Row = [string, string, string];

const BASIC: Record<string, Row[]> = {
  a: [["a","あ","ア"],["i","い","イ"],["u","う","ウ"],["e","え","エ"],["o","お","オ"]],
  ka: [["ka","か","カ"],["ki","き","キ"],["ku","く","ク"],["ke","け","ケ"],["ko","こ","コ"]],
  sa: [["sa","さ","サ"],["shi","し","シ"],["su","す","ス"],["se","せ","セ"],["so","そ","ソ"]],
  ta: [["ta","た","タ"],["chi","ち","チ"],["tsu","つ","ツ"],["te","て","テ"],["to","と","ト"]],
  na: [["na","な","ナ"],["ni","に","ニ"],["nu","ぬ","ヌ"],["ne","ね","ネ"],["no","の","ノ"]],
  ha: [["ha","は","ハ"],["hi","ひ","ヒ"],["fu","ふ","フ"],["he","へ","ヘ"],["ho","ほ","ホ"]],
  ma: [["ma","ま","マ"],["mi","み","ミ"],["mu","む","ム"],["me","め","メ"],["mo","も","モ"]],
  ya: [["ya","や","ヤ"],["yu","ゆ","ユ"],["yo","よ","ヨ"]],
  ra: [["ra","ら","ラ"],["ri","り","リ"],["ru","る","ル"],["re","れ","レ"],["ro","ろ","ロ"]],
  wa: [["wa","わ","ワ"],["wo","を","ヲ"],["n","ん","ン"]],
};

const DAKUTEN: Record<string, Row[]> = {
  ga: [["ga","が","ガ"],["gi","ぎ","ギ"],["gu","ぐ","グ"],["ge","げ","ゲ"],["go","ご","ゴ"]],
  za: [["za","ざ","ザ"],["ji","じ","ジ"],["zu","ず","ズ"],["ze","ぜ","ゼ"],["zo","ぞ","ゾ"]],
  da: [["da","だ","ダ"],["dji","ぢ","ヂ"],["dzu","づ","ヅ"],["de","で","デ"],["do","ど","ド"]],
  ba: [["ba","ば","バ"],["bi","び","ビ"],["bu","ぶ","ブ"],["be","べ","ベ"],["bo","ぼ","ボ"]],
};

const HANDAKUTEN: Record<string, Row[]> = {
  pa: [["pa","ぱ","パ"],["pi","ぴ","ピ"],["pu","ぷ","プ"],["pe","ぺ","ペ"],["po","ぽ","ポ"]],
};

const YOUON: Record<string, Row[]> = {
  kya: [["kya","きゃ","キャ"],["kyu","きゅ","キュ"],["kyo","きょ","キョ"]],
  sha: [["sha","しゃ","シャ"],["shu","しゅ","シュ"],["sho","しょ","ショ"]],
  cha: [["cha","ちゃ","チャ"],["chu","ちゅ","チュ"],["cho","ちょ","チョ"]],
  nya: [["nya","にゃ","ニャ"],["nyu","にゅ","ニュ"],["nyo","にょ","ニョ"]],
  hya: [["hya","ひゃ","ヒャ"],["hyu","ひゅ","ヒュ"],["hyo","ひょ","ヒョ"]],
  mya: [["mya","みゃ","ミャ"],["myu","みゅ","ミュ"],["myo","みょ","ミョ"]],
  rya: [["rya","りゃ","リャ"],["ryu","りゅ","リュ"],["ryo","りょ","リョ"]],
  gya: [["gya","ぎゃ","ギャ"],["gyu","ぎゅ","ギュ"],["gyo","ぎょ","ギョ"]],
  ja: [["ja","じゃ","ジャ"],["ju","じゅ","ジュ"],["jo","じょ","ジョ"]],
  bya: [["bya","びゃ","ビャ"],["byu","びゅ","ビュ"],["byo","びょ","ビョ"]],
  pya: [["pya","ぴゃ","ピャ"],["pyu","ぴゅ","ピュ"],["pyo","ぴょ","ピョ"]],
};

function build(table: Record<string, Row[]>, group: KanaEntry["group"]): KanaEntry[] {
  const out: KanaEntry[] = [];
  for (const [row, items] of Object.entries(table)) {
    for (const [romaji, hira, kata] of items) {
      out.push({ id: `kana:hi-${romaji}`, kana: hira, romaji, script: "hiragana", group, row });
      out.push({ id: `kana:ka-${romaji}`, kana: kata, romaji, script: "katakana", group, row });
    }
  }
  return out;
}

export const KANA: KanaEntry[] = [
  ...build(BASIC, "basic"),
  ...build(DAKUTEN, "dakuten"),
  ...build(HANDAKUTEN, "handakuten"),
  ...build(YOUON, "youon"),
];

export const KANA_ROWS = {
  basic: Object.keys(BASIC),
  dakuten: [...Object.keys(DAKUTEN), ...Object.keys(HANDAKUTEN)],
  youon: Object.keys(YOUON),
};

export default KANA;
