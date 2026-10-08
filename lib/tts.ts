/** Web Speech API 로 일본어 발음. 오디오 파일 없이 브라우저 내장 음성을 쓴다. */

let jaVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof speechSynthesis === "undefined") return;
  jaVoices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
}

if (typeof speechSynthesis !== "undefined") {
  refreshVoices();
  speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

export function getJaVoices(): SpeechSynthesisVoice[] {
  if (jaVoices.length === 0) refreshVoices();
  return jaVoices;
}

export function ttsSupported(): boolean {
  return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string;
  /** 진행 중인 발화를 끊고 시작 (기본 true) */
  interrupt?: boolean;
}

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (!ttsSupported()) return Promise.resolve();
  const { rate = 0.95, voiceURI, interrupt = true } = opts;
  if (interrupt) speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = rate;
    const voices = getJaVoices();
    const v = (voiceURI && voices.find((x) => x.voiceURI === voiceURI)) || voices[0];
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

/** 여러 줄 대사를 순서대로 읽는다 (청해용). 중간에 cancelSpeech() 로 중단 가능 */
export async function speakLines(lines: string[], opts: SpeakOptions = {}) {
  speechSynthesis?.cancel();
  for (const line of lines) {
    await speak(line, { ...opts, interrupt: false });
  }
}

export function cancelSpeech() {
  if (ttsSupported()) speechSynthesis.cancel();
}
