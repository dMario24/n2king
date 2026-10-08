import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** 빌드 시 생성되는 PNG 앱 아이콘 (/icon). 매니페스트와 브라우저 탭에서 사용 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        borderRadius: 112,
        color: "#fff",
        fontSize: 230,
        fontWeight: 800,
        letterSpacing: -12,
      }}
    >
      N2
    </div>,
    size,
  );
}
