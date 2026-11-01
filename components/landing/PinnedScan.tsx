"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles } from "lucide-react";
import { useRef } from "react";
import { ScanFace } from "./ScanFace";
import { Tag } from "./kit";

const CAPTIONS = [
  { title: "One map of your whole face.", body: "YouCam AI maps your skin. SplitSide divides that map at the middle of your face." },
  { title: "Product on one side, nothing on the other.", body: "The treated cheek gets the product. The control cheek stays as it is, in the same photo." },
  { title: "Everything else cancels out.", body: "Light, sleep and weather reach both sides equally. What's left is the product's effect on your photos." },
];

const CANCELLED = [
  { label: "Light: cancelled", tone: "clay" },
  { label: "Sleep: cancelled", tone: "stone" },
  { label: "Weather: cancelled", tone: "moss" },
] as const;

/** Pinning needs motion and enough height for the stage. Otherwise this is a normal section showing the finished picture. */
const PIN_WHEN = "(prefers-reduced-motion: no-preference) and (min-height: 520px)";

/**
 * The signature moment. The pin is native `position: sticky` on a tall track, with ScrollTrigger only
 * scrubbing the timeline: no pin spacer to manage, and no scroll jitter on phones.
 */
export function PinnedScan() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add(PIN_WHEN, () => {
        const q = gsap.utils.selector(root);
        const [first, second, third] = q("[data-caption]");
        const draw = (kind: string) => q(`[data-draw="${kind}"]`);

        // The markup holds the finished state; rewind it. Captions and chips use opacity alone so screen readers keep them.
        gsap.set(q("[data-caption]"), { gridArea: "1 / 1" });
        gsap.set(q("[data-draw], [data-ring]"), { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(q("[data-midline]"), { scaleY: 0, svgOrigin: "200 38" });
        gsap.set(q("[data-node]"), { scale: 0, transformOrigin: "50% 50%" });
        gsap.set(q("[data-tint]")[0], { scaleX: 0, svgOrigin: "194 274" });
        gsap.set(q("[data-tint]")[1], { scaleX: 0, svgOrigin: "206 274" });
        gsap.set(q("[data-cheek]"), { opacity: 0 });
        gsap.set(q("[data-scanline]"), { y: 18, opacity: 1 });
        gsap.set([second, third, ...q("[data-chip]")], { opacity: 0, y: 12 });
        gsap.set(q("[data-side]"), { autoAlpha: 0, scale: 0.8 });

        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 } })
          // Beat 1: the mesh draws in while the scan line sweeps and the tick ring fills.
          .to(q("[data-ring]"), { strokeDashoffset: 0, duration: 4 }, 0)
          .to(q("[data-scanline]"), { y: 530, duration: 3.6, ease: "power1.inOut" }, 0)
          .to(q("[data-scanline]"), { opacity: 0, duration: 0.3 }, 3.4)
          .to(q("[data-midline]"), { scaleY: 1, duration: 0.8 }, 0)
          .to(draw("outline"), { strokeDashoffset: 0, duration: 1.2 }, 0.2)
          .to(draw("wire"), { strokeDashoffset: 0, duration: 0.7, stagger: 0.05 }, 0.5)
          .to(draw("feature"), { strokeDashoffset: 0, duration: 0.5, stagger: 0.05 }, 1.5)
          .to(draw("cheek"), { strokeDashoffset: 0, duration: 0.45, stagger: 0.035 }, 2.1)
          .to(q("[data-node]"), { scale: 1, duration: 0.35, stagger: 0.08, ease: "back.out(2.5)" }, 3.2)
          // Beat 2: both sides flood out from the midline.
          .to(first, { opacity: 0, y: -12, duration: 0.4 }, 4.3)
          .to(second, { opacity: 1, y: 0, duration: 0.4 }, 4.6)
          .to(q("[data-tint]"), { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 4.4)
          .to(q("[data-cheek]"), { opacity: 1, duration: 0.6 }, 5.3)
          .to(q("[data-side]"), { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(1.8)" }, 5.4)
          // Beat 3: what hits both sides drops out, and the product is what's left.
          .to(second, { opacity: 0, y: -12, duration: 0.4 }, 7)
          .to(third, { opacity: 1, y: 0, duration: 0.4 }, 7.3)
          .to(q("[data-chip]"), { opacity: 1, y: 0, duration: 0.45, stagger: 0.5, ease: "back.out(1.6)" }, 7.5)
          .to({}, { duration: 0.8 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} aria-labelledby="scan-title" className="motion-safe:[@media(min-height:520px)]:h-[340svh]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)] lg:items-center lg:gap-10 lg:px-8 motion-safe:[@media(min-height:520px)]:sticky motion-safe:[@media(min-height:520px)]:top-0 motion-safe:[@media(min-height:520px)]:h-svh motion-safe:[@media(min-height:520px)]:pb-5 motion-safe:[@media(min-height:520px)]:pt-20 motion-safe:[@media(min-height:520px)]:lg:grid-rows-[minmax(0,1fr)]">
        <div className="shrink-0">
          <h2 id="scan-title" className="font-medium text-ink/80">
            One photo, measured twice
          </h2>
          <ol className="mt-1.5 grid gap-5 lg:mt-4">
            {CAPTIONS.map((c) => (
              <li key={c.title} data-caption>
                <h3 className="text-[1.4rem] font-light leading-[1.15] tracking-[-0.01em] text-balance sm:text-[1.8rem] lg:text-[2.4rem]">{c.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-snug text-ink/80 text-pretty sm:text-base lg:mt-4 lg:text-lg">{c.body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Size containment lets the face fit whatever height is left, keeping its shape. */}
        <div className="grid h-[min(80svh,40rem)] w-full place-items-center [container-type:size] lg:self-stretch motion-safe:[@media(min-height:520px)]:h-auto motion-safe:[@media(min-height:520px)]:min-h-0 motion-safe:[@media(min-height:520px)]:flex-1">
          <ScanFace className="w-[min(100cqw,73cqh)]" />
        </div>

        <ul className="relative z-10 -mt-8 flex shrink-0 flex-wrap justify-center gap-2 lg:mt-0 lg:flex-col lg:items-start lg:gap-3">
          {CANCELLED.map((c) => (
            <li key={c.label} data-chip>
              <Tag tone={c.tone}>{c.label}</Tag>
            </li>
          ))}
          <li data-chip>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-forest-deep px-3 py-1.5 text-sm text-white shadow-[var(--shadow-float)] lg:px-4 lg:py-2.5 lg:text-base">
              <Sparkles size={15} aria-hidden="true" />
              Product effect
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
