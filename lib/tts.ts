/**
 * Web Speech API 로 일본어 발음. 오디오 파일 없이 브라우저 내장 음성을 쓴다.
 *
 * 모바일에서 부드럽게 들리도록 한 처리:
 * - 음성 선택: Siri/Google 의 고품질(Enhanced/Premium) 일본어 음성을 우선 선택한다.
 * - 문장 단위 분할 후 한꺼번에 큐잉: iOS/Android 는 긴 발화를 중간에 끊거나 멈추는 버그가 있어
 *   句点(。！？) 기준으로 나누되, await 로 하나씩 보내지 않고 한 번에 큐에 넣어 문장 사이 공백을 없앤다.
 * - cancel() 직후 speak() 는 iOS 에서 첫 발화가 삼켜지므로 짧게 쉬었다 시작한다.
 * - 말하는 동안 주기적으로 resume() 을 호출해 엔진이 멈추는 현상(Chrome/iOS)을 방지한다.
 * - 화자별 pitch 를 달리해 대화(청해)를 구분해 들을 수 있게 한다.
 */

let jaVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof speechSynthesis === "undefined") return;
  jaVoices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("ja"));
}

if (typeof speechSynthesis !== "undefined") {
  refreshVoices();
  speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

export function getJaVoices(): SpeechSynthesisVoice[] {
  if (jaVoices.length === 0) refreshVoices();
  return [...jaVoices].sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** 품질 추정 점수. 높을수록 자연스러운 음성 (iOS Enhanced/Premium, Google, 로컬 음성 우선) */
export function voiceScore(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/premium|プレミアム/.test(n)) s += 50;
  if (/enhanced|拡張/.test(n)) s += 40;
  if (/google/.test(n)) s += 30;
  if (/kyoko|o-ren|otoya|hattori|kyōko|siri/.test(n)) s += 20;
  if (/microsoft .*(nanami|keita|ayumi|ichiro)/.test(n)) s += 15;
  if (/compact|eloquence/.test(n)) s -= 30;
  if (v.localService) s += 5;
  if (v.default) s += 2;
  return s;
}

export function ttsSupported(): boolean {
  return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string;
  pitch?: number;
  /** 진행 중인 발화를 끊고 시작 (기본 true) */
  interrupt?: boolean;
}

function pickVoice(voiceURI?: string): SpeechSynthesisVoice | undefined {
  const voices = getJaVoices();
  return (voiceURI && voices.find((x) => x.voiceURI === voiceURI)) || voices[0];
}

/** 句点·감탄·물음표 기준으로 문장 분할. 너무 긴 문장은 読点(、)에서 한 번 더 나눈다 (Android 200자 제한 대응). */
export function splitSentences(text: string, maxLen = 120): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= maxLen) {
      out.push(p);
      continue;
    }
    let buf = "";
    for (const seg of p.split(/(?<=、)/)) {
      if (buf && buf.length + seg.length > maxLen) {
        out.push(buf);
        buf = "";
      }
      buf += seg;
    }
    if (buf) out.push(buf);
  }
  return out.length ? out : [text];
}

let keepAlive: ReturnType<typeof setInterval> | undefined;
function startKeepAlive() {
  stopKeepAlive();
  keepAlive = setInterval(() => {
    if (!speechSynthesis.speaking) return stopKeepAlive();
    // 일부 엔진은 ~15초 뒤 멈춘다. paused 가 아니어도 resume 은 무해하다.
    speechSynthesis.resume();
  }, 5000);
}
function stopKeepAlive() {
  if (keepAlive) clearInterval(keepAlive);
  keepAlive = undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Chunk {
  text: string;
  pitch?: number;
  rate?: number;
}

/** 여러 조각을 한 번에 큐잉하고 마지막 조각이 끝나면 resolve */
async function enqueue(chunks: Chunk[], opts: SpeakOptions): Promise<void> {
  if (!ttsSupported() || chunks.length === 0) return;
  const { rate = 1, voiceURI, pitch = 1, interrupt = true } = opts;
  if (interrupt) {
    const wasSpeaking = speechSynthesis.speaking || speechSynthesis.pending;
    speechSynthesis.cancel();
    if (wasSpeaking) await sleep(120); // iOS: cancel 직후 speak 는 첫 발화가 삼켜짐
  }
  const voice = pickVoice(voiceURI);
  return new Promise((resolve) => {
    let remaining = chunks.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) {
        stopKeepAlive();
        resolve();
      }
    };
    for (const c of chunks) {
      const u = new SpeechSynthesisUtterance(c.text);
      u.lang = "ja-JP";
      u.rate = c.rate ?? rate;
      u.pitch = c.pitch ?? pitch;
      u.volume = 1;
      if (voice) u.voice = voice;
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    }
    startKeepAlive();
  });
}

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return enqueue(
    splitSentences(text).map((t) => ({ text: t })),
    opts,
  );
}

export interface SpeechLine {
  text: string;
  /** 화자 구분. A/남 = 기본 pitch, B/여 = 높은 pitch, N(나레이터) = 약간 낮고 느리게 */
  speaker?: "A" | "B" | "N";
}

const SPEAKER_PITCH: Record<NonNullable<SpeechLine["speaker"]>, number> = { A: 0.95, B: 1.2, N: 0.9 };

/** 대사 여러 줄을 끊김 없이 순서대로 읽는다 (청해용). 화자별 pitch 로 구분. cancelSpeech() 로 중단 가능 */
export function speakLines(lines: (string | SpeechLine)[], opts: SpeakOptions = {}): Promise<void> {
  const chunks: Chunk[] = [];
  for (const l of lines) {
    const line = typeof l === "string" ? { text: l } : l;
    const pitch = line.speaker ? SPEAKER_PITCH[line.speaker] : opts.pitch;
    const rate = line.speaker === "N" ? (opts.rate ?? 1) * 0.95 : opts.rate;
    for (const s of splitSentences(line.text)) chunks.push({ text: s, pitch, rate });
  }
  return enqueue(chunks, opts);
}

/** "男：…\n女：…" 형식의 모의고사 스크립트를 화자 라인으로 변환 */
export function parseScript(script: string): SpeechLine[] {
  return script
    .split(/\n+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(/^(男|女|M|F|A|B|N|ナレーター|質問)\s*[：:]\s*(.*)$/);
      if (!m) return { text: raw };
      const who = m[1];
      const speaker: SpeechLine["speaker"] = /^(女|F|B)$/.test(who) ? "B" : /^(N|ナレーター|質問)$/.test(who) ? "N" : "A";
      return { text: m[2], speaker };
    });
}

export function cancelSpeech() {
  if (!ttsSupported()) return;
  stopKeepAlive();
  speechSynthesis.cancel();
}

let warmed = false;
/**
 * iOS Safari 는 사용자 제스처 안에서 한 번 speak() 가 호출돼야 이후 자동 재생(effect 안 speak)이 허용된다.
 * 첫 터치/클릭 시 무음 발화를 한 번 보내 엔진을 깨운다.
 */
export function warmUpOnFirstGesture() {
  if (warmed || !ttsSupported() || typeof window === "undefined") return;
  const handler = () => {
    if (warmed) return;
    warmed = true;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      u.lang = "ja-JP";
      speechSynthesis.speak(u);
    } catch {}
    window.removeEventListener("touchend", handler);
    window.removeEventListener("pointerdown", handler);
  };
  window.addEventListener("touchend", handler, { passive: true });
  window.addEventListener("pointerdown", handler, { passive: true });
}
