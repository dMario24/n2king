import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { THEME_KEY } from "@/components/shell/theme-toggle";

/** 전체 라우트가 정적이어야 함을 빌드 시점에 강제한다 (cacheComponents 전용 세그먼트 설정). */
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: {
    default: "N2King · JLPT N2 59일 완성",
    template: "%s · N2King",
  },
  description: "노베이스에서 2026년 12월 6일 JLPT N2 합격까지. 짜투리 시간 복습과 집중 학습을 위한 개인 학습 앱.",
  applicationName: "N2King",
  appleWebApp: { capable: true, title: "N2King", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c10" },
  ],
};

/** 페인트 전에 저장된 테마를 적용해 깜빡임을 막는다. */
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-theme="light" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
