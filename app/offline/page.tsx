import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "오프라인" };

export default function OfflinePage() {
  return (
    <>
      <PageHeader title="오프라인이에요" description="네트워크 없이도 이미 방문했던 화면은 열 수 있어요." />
      <Card className="text-sm text-muted">
        <p>학습 기록은 이 기기에 저장되어 있으니 걱정하지 마세요. 연결이 돌아오면 아래 버튼으로 돌아가세요.</p>
        <div className="mt-4 flex gap-2">
          <LinkButton href="/">홈으로</LinkButton>
          <LinkButton href="/review" variant="secondary">복습</LinkButton>
        </div>
      </Card>
    </>
  );
}
