"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf } from "lucide-react";
import { useRef } from "react";
import { Ring } from "@/components/motion";
import { Tag } from "./kit";
import { GlossyJar, SplitCapsule } from "./SplitCapsule";

/** Hero object: the capsule opens from its midline, the jar settles in front and drifts while on screen. */
export function HeroArt() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        gsap.set(root.current, { autoAlpha: 1 });
        gsap.set(q("[data-half]"), { svgOrigin: "200 274" });
        gsap.set(q("[data-midline]"), { svgOrigin: "200 38" });
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo(q("[data-half]"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" })
          .fromTo(q("[data-midline]"), { scaleY: 0 }, { scaleY: 1, duration: 0.7 }, 0.1)
          .fromTo(q("[data-jar]"), { y: 56, scale: 0.86, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1, ease: "back.out(1.4)" }, 0.25)
          .fromTo(q("[data-pop]"), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0.7);
        gsap.to(q("[data-float]"), {
          y: -10,
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" },
        });
        gsap.to(q("[data-lift]"), { yPercent: -9, ease: "none", scrollTrigger: { trigger: root.current, start: "top 15%", end: "bottom top", scrub: 0.5 } });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => gsap.set(root.current, { autoAlpha: 1 }));
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} data-reveal="" className="mx-auto w-full max-w-[22rem] lg:mr-0 lg:w-[min(29rem,calc((100svh-8rem)*0.73))] lg:max-w-none">
      <SplitCapsule>
        <span data-pop className="absolute left-[15%] top-[13%]">
          <Tag dot="treated">Product</Tag>
        </span>
        <span data-pop className="absolute right-[15%] top-[13%]">
          <Tag dot="control">Nothing</Tag>
        </span>
        <div data-lift className="absolute inset-x-[5%] top-[21%]">
          <div data-jar>
            <div data-float>
              <GlossyJar />
            </div>
          </div>
        </div>
        <div data-pop className="absolute inset-x-[3%] bottom-[5%] flex items-center gap-3 rounded-full bg-forest-deep py-2 pl-5 pr-2 text-white shadow-[var(--shadow-float)]">
          <Leaf size={18} aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block">Left cheek only</span>
            <span className="block text-sm text-white/80">Day 1 of 15</span>
          </span>
          <Ring progress={1 / 15} size={48} color="white" label="Day 1 of 15">
            1/15
          </Ring>
        </div>
      </SplitCapsule>
    </div>
  );
}
