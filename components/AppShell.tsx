"use client";
import { FlaskConical, Library, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/trials", label: "Trials", icon: FlaskConical },
  { href: "/preview", label: "Preview", icon: Sparkles },
  { href: "/passport", label: "Passport", icon: Library },
  { href: "/evidence", label: "Evidence", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-semibold tracking-tight ${className}`} aria-label="SplitSide home">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M11 1a10 10 0 0 0 0 20z" fill="var(--color-treated)" />
        <path d="M11 1a10 10 0 0 1 0 20z" fill="var(--color-control)" />
        <rect x="10.4" y="0" width="1.2" height="22" fill="var(--color-paper)" />
      </svg>
      SplitSide
    </Link>
  );
}

/** Mobile-first app frame: compact header, content column, bottom navigation within thumb reach. */
export function AppShell({ children, title, back, action }: { children: ReactNode; title?: string; back?: string; action?: ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 bg-paper/90 px-4 backdrop-blur">
        {back ? (
          <Link href={back} className="-ml-2 rounded-full px-2 py-1 text-sm font-medium text-muted hover:text-ink">
            ‹ Back
          </Link>
        ) : (
          <Logo />
        )}
        {title && <h1 className="truncate text-base font-semibold">{title}</h1>}
        <div className="min-w-12 text-right">{action}</div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-2">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href) || (href === "/trials" && path.startsWith("/trial/"));
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-ink" : "text-muted"}`}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
