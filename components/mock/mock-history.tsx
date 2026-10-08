"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "@/components/ui/card";
import { MOCK } from "@/data/mock";
import { getDb } from "@/lib/db";

export function MockHistory() {
  const rows = useLiveQuery(() => getDb().mockResults.orderBy("ts").reverse().toArray(), []);
  if (!rows || rows.length === 0) return null;
  return (
    <Card className="mt-4">
      <h2 className="mb-2 font-semibold">응시 기록</h2>
      <ul className="divide-y divide-border text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2">
            <span>
              {MOCK.find((m) => m.id === r.mockId)?.title ?? r.mockId}
              <span className="ml-2 text-xs text-muted">{new Date(r.ts).toLocaleDateString("ko-KR")}</span>
            </span>
            <span className="font-semibold">{Math.round((r.correct / r.total) * 100)}% <span className="text-xs font-normal text-muted">({r.correct}/{r.total})</span></span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
