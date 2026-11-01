"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

/** A line that fills as its parent scrolls past, tying a sequence of steps together. */
export function ScrollRail({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(ref.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ref.current?.parentElement, start: "top 72%", end: "bottom 72%", scrub: 0.4 } });
    });
    return () => mm.revert();
  });
  return <span ref={ref} aria-hidden="true" className={`block origin-top ${className}`} />;
}
