"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { fitMidline } from "@/lib/split/midline";
import type { Landmarks, PixelBuffer } from "@/lib/types";

const NO_REDUCE = "(prefers-reduced-motion: no-preference)";
const PHOTO_LABEL = "absolute rounded-full bg-night/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur";

/** Paints in a layout effect, so the sweep's cover never shows an empty canvas. */
function PixelCanvas({ image, ...props }: { image: PixelBuffer } & ComponentProps<"canvas">) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!;
    c.width = image.width;
    c.height = image.height;
    c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  }, [image]);
  return <canvas ref={ref} {...props} />;
}

/** A glowing line looping top to bottom. Its layer travels by its own height, so nothing is measured. */
export function ScanSweep() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCE, () => {
      gsap.set(ref.current, { autoAlpha: 1 });
      gsap.fromTo(ref.current, { yPercent: 0 }, { yPercent: 100, duration: 1.9, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    return () => mm.revert();
  });
  return (
    <div ref={ref} className="pointer-events-none invisible absolute inset-0 text-white" aria-hidden="true">
      <span className="block h-0.5 bg-current shadow-[0_0_18px_4px_currentColor]" />
    </div>
  );
}

/** The bare photo under a scanning line and a breathing veil, shown while YouCam AI works. */
export function WorkingPhoto({ photo, message }: { photo: PixelBuffer; message: string }) {
  const veil = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCE, () => {
      gsap.fromTo(veil.current, { opacity: 0.1 }, { opacity: 0.4, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    return () => mm.revert();
  });
  return (
    <div className="relative overflow-hidden rounded-panel bg-night">
      <PixelCanvas image={photo} className="block h-auto w-full -scale-x-100" role="img" aria-label="Your photo" />
      <div ref={veil} className="absolute inset-0 bg-forest-deep opacity-0" aria-hidden="true" />
      <ScanSweep />
      <p role="status" className="absolute inset-x-3 bottom-3 rounded-2xl bg-night/70 px-3 py-2 text-center text-sm text-white backdrop-blur">
        {message}
      </p>
    </div>
  );
}

/**
 * A split composite shown mirrored like a selfie (the user's left on screen-left), with the midline
 * and a permanent "Preview: simulated" badge (docs/14: previews are never measurements). On reveal,
 * a bright divider sweeps the bare photo away. The cover stays invisible unless GSAP arms it, so
 * reduced motion goes straight to the result.
 */
export function SplitPreview({ image, before, landmarks, leftLabel, rightLabel }: { image: PixelBuffer; before: PixelBuffer; landmarks: Landmarks; leftLabel: string; rightLabel: string }) {
  const root = useRef<HTMLElement>(null);
  const m = fitMidline(landmarks);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCE, () => {
        const sweep = { duration: 1.2, ease: "power2.inOut" };
        gsap.set("[data-cover], [data-bar]", { autoAlpha: 1 });
        gsap
          .timeline({ delay: 0.15 })
          // The cover slides right while its photo slides left: a wipe using transforms alone.
          .fromTo("[data-cover], [data-bar]", { xPercent: 0 }, { xPercent: 100, ...sweep }, 0)
          .fromTo("[data-cover-photo]", { xPercent: 0 }, { xPercent: -100, ...sweep }, 0)
          .to("[data-bar]", { autoAlpha: 0, duration: 0.25 })
          .from("[data-midline]", { scaleY: 0, transformOrigin: "50% 0%", duration: 0.5, ease: "power2.out" }, "-=0.2")
          .from("[data-label]", { y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, "<0.1");
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const { width: w, height: h } = image;
  return (
    <figure ref={root}>
      <div className="relative overflow-hidden rounded-panel bg-night">
        <PixelCanvas image={image} className="block h-auto w-full -scale-x-100" role="img" aria-label={`Split preview: ${leftLabel} on your left, ${rightLabel} on your right`} />
        <svg data-midline viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {/* Mirrored by hand to match the canvas. */}
          <line x1={w - m.b} y1={0} x2={w - (m.a * h + m.b)} y2={h} stroke="white" strokeOpacity="0.9" strokeWidth={w / 300} strokeDasharray={`${w / 60} ${w / 80}`} />
        </svg>
        <div data-cover className="invisible absolute inset-0 overflow-hidden" aria-hidden="true">
          <div data-cover-photo className="absolute inset-0">
            <PixelCanvas image={before} className="block h-full w-full -scale-x-100" />
          </div>
        </div>
        <div data-bar className="pointer-events-none invisible absolute inset-0 text-white" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-[3px] -translate-x-1/2 bg-current shadow-[0_0_28px_8px_currentColor]" />
        </div>
        <span className={`${PHOTO_LABEL} left-3 top-3`}>Preview: simulated</span>
        <span data-label className={`${PHOTO_LABEL} bottom-3 left-3 max-w-[45%] truncate`}>
          {leftLabel}
        </span>
        <span data-label className={`${PHOTO_LABEL} bottom-3 right-3 max-w-[45%] truncate`}>
          {rightLabel}
        </span>
      </div>
    </figure>
  );
}
