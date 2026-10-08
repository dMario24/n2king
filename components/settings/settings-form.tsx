"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { exportAll, importAll, resetAll, setSetting, validateBundle } from "@/lib/db";
import { useSettings } from "@/lib/db-hooks";
import { INTENSITY_LABEL, type Intensity } from "@/lib/plan";
import { getJaVoices, speak, ttsSupported } from "@/lib/tts";

export function SettingsForm() {
  const s = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ttsSupported()) return;
    const load = () => setVoices(getJaVoices());
    const id = setTimeout(load, 0);
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(id);
      speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  async function onExport() {
    const bundle = await exportAll();
    const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `n2king-backup-${bundle.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("백업 파일을 내려받았어요. 다른 기기에서 '가져오기'로 복원하세요.");
  }

  async function onImport(file: File) {
    try {
      const json = JSON.parse(await file.text());
      if (!validateBundle(json)) throw new Error("형식이 올바르지 않습니다");
      if (!confirm(`현재 기기의 기록을 지우고 백업(${json.exportedAt.slice(0, 10)}, 카드 ${json.cards.length}장)으로 교체할까요?`)) return;
      await importAll(json);
      setMsg("가져오기 완료. 홈에서 복습 수가 바뀐 것을 확인하세요.");
    } catch (e) {
      setMsg(`가져오기 실패: ${(e as Error).message}`);
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card>
        <h2 className="mb-3 font-semibold">학습 강도</h2>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "normal", "hard"] as Intensity[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSetting("intensity", i)}
              className={`rounded-xl border px-3 py-3 text-sm ${s.intensity === i ? "border-brand bg-brand-soft font-semibold text-brand" : "border-border"}`}
            >
              {INTENSITY_LABEL[i]}
              <span className="block text-[11px] font-normal text-muted">{i === "light" ? "신규 70%" : i === "normal" ? "커리큘럼 기준" : "신규 130%"}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">59일 안에 전체 분량을 끝내려면 「보통」 이상이 필요해요. 복습이 밀리면 잠시 「가볍게」로.</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">짧은 복습 카드 수</h2>
        <div className="flex items-center gap-3">
          <input type="range" min={5} max={30} step={5} value={s.quickBatch} onChange={(e) => setSetting("quickBatch", Number(e.target.value))} className="flex-1" />
          <span className="w-12 text-right font-semibold">{s.quickBatch}장</span>
        </div>
        <p className="mt-2 text-xs text-muted">홈의 「N장 복습」 버튼. 이동 중·대기 중 3분 정도에 맞게 조절하세요.</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">발음 (TTS)</h2>
        {!ttsSupported() ? (
          <p className="text-sm text-muted">이 브라우저는 음성 합성을 지원하지 않아요.</p>
        ) : (
          <>
            <label className="block text-sm">
              음성
              <select
                value={s.ttsVoice ?? ""}
                onChange={(e) => setSetting("ttsVoice", e.target.value || undefined)}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-2"
              >
                <option value="">자동 (가장 자연스러운 음성 추천)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </label>
            {voices.length === 0 && <p className="mt-1 text-xs text-warning">일본어 음성이 없어요. OS 설정에서 일본어 음성을 추가하세요 (iOS: 설정 › 손쉬운 사용 › 콘텐츠 말하기 › 음성).</p>}
            <div className="mt-3 flex items-center gap-3 text-sm">
              속도
              <input type="range" min={0.6} max={1.3} step={0.05} value={s.ttsRate} onChange={(e) => setSetting("ttsRate", Number(e.target.value))} className="flex-1" />
              <span className="w-10 text-right">{s.ttsRate.toFixed(2)}</span>
            </div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => speak("日本語能力試験、頑張りましょう。", { rate: s.ttsRate, voiceURI: s.ttsVoice })}>
              🔊 테스트
            </Button>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">화면</h2>
        <div className="flex items-center justify-between text-sm">
          <span>다크 모드</span>
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">백업 · 기기 이동</h2>
        <p className="mb-3 text-sm text-muted">기록은 이 브라우저에만 저장됩니다. 다른 기기로 옮기려면 내보내기 → 가져오기.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport}>JSON 내보내기</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>가져오기</Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
        {msg && <p className="mt-3 text-sm text-brand">{msg}</p>}
      </Card>

      <Card className="border-danger/30">
        <h2 className="mb-2 font-semibold text-danger">초기화</h2>
        <p className="mb-3 text-sm text-muted">모든 카드·기록·설정을 삭제합니다. 되돌릴 수 없어요.</p>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            if (confirm("정말 모든 학습 기록을 삭제할까요?") && confirm("마지막 확인: 삭제 후 복구할 수 없습니다.")) {
              await resetAll();
              setMsg("초기화했어요.");
            }
          }}
        >
          전체 삭제
        </Button>
      </Card>

      <p className="text-center text-xs text-muted">시험일 {s.examDate} · N2King</p>
    </div>
  );
}
