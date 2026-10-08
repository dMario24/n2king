import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "N2King · JLPT N2 59일 완성",
    short_name: "N2King",
    description: "노베이스에서 JLPT N2 합격까지, 짜투리 시간과 집중 학습을 위한 앱",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
