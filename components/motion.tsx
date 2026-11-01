"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, type ReactNode } from "react";

const NO_REDUCE = "(prefers-reduced-motion: no-preference)";

/** Makes [data-reveal] content visible when animation is off or skipped (CSS hides it pre-hydration). */
const showNow = (el: Element | null) => {
  if (el) gsap.set(el, { autoAlpha: 1 });
};

/**
 * Fade-and-rise on mount (or on scroll with `scroll`). With `stagger`, animates direct children in
 * sequence. Reduced motion shows content immediately. Uses fromTo with an explicit end state,
 * because the `.motion [data-reveal]` rule makes the computed start hidden.
 */
export function Reveal({ children, className, y = 18, delay = 0, stagger, scroll = false, as: Tag = "div" }: { children: ReactNode; className?: string; y?: number; delay?: number; stagger?: number; scroll?: boolean; as?: "div" | "ul" | "ol" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCE, () => {
        showNow(el);
        const targets = stagger ? Array.from(el.children) : el;
        gsap.fromTo(targets, { y, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay, stagger: stagger ?? 0, ease: "power3.out", clearProps: "transform", scrollTrigger: scroll ? { trigger: el, start: "top 88%", once: true } : undefined });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => showNow(el));
      return () => mm.revert();
    },
    { scope: ref },
  );
  const Any = Tag as "div";
  return (
    <Any ref={ref} className={className} data-reveal="">
      {children}
    </Any>
  );
}

/** Number that counts up once when it mounts or when `value` changes. */
export function CountUp({ value, prefix = "", suffix = "", duration = 1.1 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const o = { v: 0 };
    const tween = gsap.to(o, { v: value, duration, ease: "power2.out", onUpdate: () => setShown(Math.round(o.v)) });
    return () => {
      tween.kill();
    };
  }, [value, duration]);
  return (
    <>
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </>
  );
}

/** Circular progress ring; the arc draws in on mount. */
export function Ring({ progress, size = 56, stroke = 3, color = "currentColor", children, label }: { progress: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label: string }) {
  const arc = useRef<SVGCircleElement>(null);
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.min(1, Math.max(0, progress));
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCE, () => {
      gsap.fromTo(arc.current, { strokeDashoffset: c }, { strokeDashoffset: c * (1 - target), duration: 1.2, ease: "power2.out" });
    });
    return () => mm.revert();
  }, [c, target]);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth={stroke} />
        <circle ref={arc} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - target)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="relative text-[10px] leading-none">{children}</span>
    </span>
  );
}
