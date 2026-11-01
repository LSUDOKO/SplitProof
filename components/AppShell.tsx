"use client";
import { ChevronLeft, Home, Library, ScanFace, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconLink } from "./ui";

const NAV = [
  { href: "/trials", label: "Trials", icon: Home, match: ["/trials", "/trial/", "/hair"] },
  { href: "/preview", label: "Preview", icon: Sparkles, match: ["/preview"] },
  { href: "/scan", label: "Scan", icon: ScanFace, match: ["/scan"], centre: true },
  { href: "/passport", label: "Passport", icon: Library, match: ["/passport", "/evidence"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings", "/about"] },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-lg font-medium tracking-tight ${className}`} aria-label="SplitSide home">
      <svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M11 1a10 10 0 0 0 0 20z" fill="var(--color-treated)" />
        <path d="M11 1a10 10 0 0 1 0 20z" fill="var(--color-control)" />
        <rect x="10.4" y="0" width="1.2" height="22" fill="var(--color-paper)" />
      </svg>
      SplitSide
    </Link>
  );
}

/**
 * Mobile-first frame: round header controls, content column, and a floating pill navigation
 * with the guided scanner raised in the centre (the app's primary action).
 */
export function AppShell({ children, title, back, action }: { children: ReactNode; title?: string; back?: string; action?: ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 grid h-16 grid-cols-[3rem_1fr_auto] items-center gap-3 bg-paper/80 px-4 backdrop-blur">
        {back ? (
          <IconLink href={back} label="Back">
            <ChevronLeft size={20} aria-hidden="true" />
          </IconLink>
        ) : (
          <Logo className="col-span-2" />
        )}
        {back && <h1 className="truncate text-center text-lg font-normal">{title}</h1>}
        <div className="flex min-w-11 justify-end">{action}</div>
      </header>
      <main className="flex-1 px-4 pb-32 pt-1">{children}</main>
      <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-fit pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        <ul className="flex items-center gap-2 rounded-full bg-card/90 p-2 shadow-[var(--shadow-float)] backdrop-blur">
          {NAV.map(({ href, label, icon: Icon, match, centre }) => {
            const active = match.some((m) => path.startsWith(m));
            return (
              <li key={href} className={centre ? "-my-5 mx-1" : ""}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={
                    centre
                      ? "flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#7f9c7d,var(--color-forest)_70%)] text-white shadow-[0_0_0_6px_rgb(221_233_218/0.9),var(--shadow-float)]"
                      : `flex h-12 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-night text-white" : "bg-raised/80 text-ink hover:bg-white"}`
                  }
                >
                  <Icon size={centre ? 26 : 20} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
