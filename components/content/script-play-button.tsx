"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/db-hooks";
import { cancelSpeech, parseScript, speakLines } from "@/lib/tts";

/** 남/여 화자 스크립트를 화자별 목소리 톤으로 끊김 없이 재생 */
export function ScriptPlayButton({ script }: { script: string }) {
  const settings = useSettings();
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => cancelSpeech(), []);
  return (
    <button
      type="button"
      aria-label={playing ? "재생 중지" : "대화 듣기"}
      onClick={async () => {
        if (playing) {
          cancelSpeech();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        await speakLines(parseScript(script), { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
        setPlaying(false);
      }}
      className="inline-grid size-11 place-items-center rounded-full bg-surface-2 text-lg hover:bg-border"
    >
      {playing ? "⏹" : "🔊"}
    </button>
  );
}
