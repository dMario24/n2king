import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <PageHeader title="N2King" description="JLPT N2 · 2026년 12월 6일 합격을 향해" />
      <Card>
        <p className="text-sm text-muted">대시보드는 다음 단계에서 채워집니다.</p>
      </Card>
    </>
  );
}
