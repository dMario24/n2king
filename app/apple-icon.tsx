import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS 홈 화면 아이콘 (apple-touch-icon). iOS 는 SVG 아이콘을 쓰지 않으므로 PNG 로 생성 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4f46e5",
        color: "#fff",
        fontSize: 84,
        fontWeight: 800,
        letterSpacing: -4,
      }}
    >
      N2
    </div>,
    size,
  );
}
