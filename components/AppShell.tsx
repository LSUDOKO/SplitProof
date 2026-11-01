"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronLeft, Home, Library, ScanFace, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
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
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      // Page entrance + nav spring. The live scanner stays out: MediaPipe needs the frame budget.
      if (path.endsWith("/scan")) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("main > *", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity,visibility" });
        gsap.fromTo("nav li", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.04, ease: "back.out(1.8)", clearProps: "transform,opacity,visibility" });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [path] },
  );
  return (
    <div ref={root} className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header data-noprint className="sticky top-0 z-10 grid h-16 grid-cols-[3rem_1fr_auto] items-center gap-3 bg-paper/80 px-4 backdrop-blur">
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
      <nav data-noprint className="fixed inset-x-0 bottom-4 z-20 mx-auto w-fit pb-[env(safe-area-inset-bottom)]" aria-label="Main">
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
                      ? "flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#7f9c7d,var(--color-forest)_70%)] text-white shadow-[var(--shadow-float)] outline outline-[6px] outline-paper/90 [animation:ring-pulse_2.8s_ease-out_infinite]"
                      : `flex h-12 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-night text-white" : "bg-raised/80 text-ink hover:brightness-105"}`
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
