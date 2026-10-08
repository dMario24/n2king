"use client";

import { useEffect } from "react";
import { warmUpOnFirstGesture } from "@/lib/tts";

/** 첫 터치에서 음성 엔진을 깨워 모바일에서 자동 발음이 막히지 않게 한다 */
export function TtsWarmup() {
  useEffect(() => {
    warmUpOnFirstGesture();
  }, []);
  return null;
}
