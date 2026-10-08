"use client";

import { speak } from "@/lib/tts";
import { useSettings } from "@/lib/db-hooks";

export function SpeakButton({ text, className = "", size = "md" }: { text: string; className?: string; size?: "sm" | "md" }) {
  const settings = useSettings();
  return (
    <button
      type="button"
      aria-label="발음 듣기"
      onClick={(e) => {
        e.stopPropagation();
        void speak(text, { rate: settings.ttsRate, voiceURI: settings.ttsVoice });
      }}
      className={`inline-grid place-items-center rounded-full bg-surface-2 text-foreground hover:bg-border ${size === "sm" ? "size-8 text-sm" : "size-11 text-lg"} ${className}`}
    >
      🔊
    </button>
  );
}
