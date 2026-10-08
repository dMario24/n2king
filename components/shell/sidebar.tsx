"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

/** 데스크톱 사이드바 (md 이상). */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 md:flex">
      <Link href="/" className="mb-4 flex items-center gap-2 px-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand font-bold text-brand-fg">N2</span>
        <span className="font-semibold">N2King</span>
      </Link>
      <ul className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-brand-soft font-medium text-brand" : "text-foreground/80 hover:bg-surface-2"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between px-2 pt-3 text-xs text-muted">
        <span>JLPT N2 · 2026.12.06</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
