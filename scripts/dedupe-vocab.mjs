// 어휘 파일 간 중복 단어(표기+읽기 동일)를 제거한다. 먼저 나오는(낮은 주차) 파일이 소유권을 가진다.
// 사용: node --experimental-strip-types scripts/dedupe-vocab.mjs
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const files = ["basic-w1", "basic-w2", "basic-w3", "n2-w4", "n2-w5", "n2-w6", "n2-w7", "n2-w8"];
const seen = new Map();
let removedTotal = 0;
for (const f of files) {
  const path = resolve("data/vocab", `${f}.ts`);
  const mod = await import(path);
  const list = mod.default;
  const kept = [];
  const removed = [];
  for (const v of list) {
    const key = `${v.word}|${v.reading}`;
    if (seen.has(key)) removed.push(`${v.word}(${seen.get(key)})`);
    else {
      seen.set(key, f);
      kept.push(v);
    }
  }
  if (removed.length) {
    removedTotal += removed.length;
    console.log(`${f}: ${removed.length}개 제거 →`, removed.slice(0, 12).join(", "), removed.length > 12 ? "…" : "");
    const body = kept.map((v) => "  " + JSON.stringify(v).replace(/"([a-zA-Z]+)":/g, "$1: ")).join(",\n");
    writeFileSync(
      path,
      `import type { VocabEntry } from "@/lib/content/types";\n\nexport default [\n${body},\n] satisfies VocabEntry[];\n`,
    );
  }
}
console.log(`총 ${removedTotal}개 제거, 남은 어휘 ${seen.size}개`);
