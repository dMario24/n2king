export interface NavItem {
  href: string;
  label: string;
  /** 모바일 하단 탭에 노출 여부 */
  tab?: boolean;
  icon: "home" | "book" | "repeat" | "quiz" | "calendar" | "text" | "ear" | "exam" | "notebook" | "chart" | "settings" | "focus";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", tab: true, icon: "home" },
  { href: "/learn", label: "학습", tab: true, icon: "book" },
  { href: "/review", label: "복습", tab: true, icon: "repeat" },
  { href: "/quiz", label: "퀴즈", tab: true, icon: "quiz" },
  { href: "/plan", label: "플랜", tab: true, icon: "calendar" },
  { href: "/focus", label: "집중 세션", icon: "focus" },
  { href: "/reading", label: "독해", icon: "text" },
  { href: "/listening", label: "청해", icon: "ear" },
  { href: "/mock", label: "모의고사", icon: "exam" },
  { href: "/mistakes", label: "오답노트", icon: "notebook" },
  { href: "/stats", label: "통계", icon: "chart" },
  { href: "/settings", label: "설정", icon: "settings" },
];
