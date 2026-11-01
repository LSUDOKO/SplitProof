"use client";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { previews } from "@/lib/db";
import { HAIR_SWATCH } from "@/lib/preview/hair";
import type { PreviewRecord } from "@/lib/types";

const MIDLINE = { stroke: "white", strokeWidth: 2, strokeDasharray: "4 5" };
const FEATURES = { fill: "none", stroke: "#3b2a1f", strokeWidth: 2.4, strokeLinecap: "round" } as const;

/** A foundation on the left half of a face, bare skin on the right: the artist's jawline swatch. */
function ShadeArt() {
  return (
    <svg viewBox="0 0 120 150" className="h-36 w-auto shrink-0" aria-hidden="true">
      <path d="M46 116v22c0 5 6 8 14 8s14-3 14-8v-22z" fill="#a9734f" />
      <path d="M60 10C32 10 16 34 16 64c0 34 22 66 44 66z" fill="#dcae88" />
      <path d="M60 10c28 0 44 24 44 54 0 34-22 66-44 66z" fill="#b9825c" />
      <g {...FEATURES}>
        <path d="M32 58c6-5 14-5 20 0M68 58c6-5 14-5 20 0" />
        <path d="M36 70c4 3 10 3 14 0M70 70c4 3 10 3 14 0" />
        <path d="M52 98c5 3 11 3 16 0" stroke="#8f4d40" />
      </g>
      <path d="M60 4v144" {...MIDLINE} />
      <g stroke="var(--color-raised)" strokeWidth="2">
        <circle cx="8" cy="138" r="6.5" fill="#efcfae" />
        <circle cx="22" cy="138" r="6.5" fill="#dcae88" />
        <circle cx="36" cy="138" r="6.5" fill="#b9825c" />
      </g>
    </svg>
  );
}

/** One side of the head in the new colour, the other in the current one. */
function HairArt() {
  const fresh = HAIR_SWATCH["Copper Red"];
  const now = HAIR_SWATCH["Chocolate Brown"];
  return (
    <svg viewBox="0 0 120 150" className="h-28 w-auto self-start" aria-hidden="true">
      <path d="M60 8C28 8 12 34 12 66c0 28 2 50 8 66h40z" fill={fresh} />
      <path d="M60 8c32 0 48 26 48 58 0 28-2 50-8 66H60z" fill={now} />
      <path d="M60 36c-18 0-30 14-30 36 0 26 14 50 30 50s30-24 30-50c0-22-12-36-30-36z" fill="#c8946c" />
      <path d="M60 28C44 32 32 44 28 64c14-2 26-12 32-24z" fill={fresh} />
      <path d="M60 28c16 4 28 16 32 36-14-2-26-12-32-24z" fill={now} />
      <g {...FEATURES}>
        <path d="M40 76c4 3 10 3 14 0M66 76c4 3 10 3 14 0" />
        <path d="M52 100c5 3 11 3 16 0" stroke="#8f4d40" />
      </g>
      <path d="M60 4v144" {...MIDLINE} />
    </svg>
  );
}

/** The real hoop cutouts the try-on uses. */
function HoopsArt() {
  return (
    <span className="relative block h-28 w-full">
      <Image src="/preview/hoop-gold.png" alt="" width={72} height={72} className="absolute left-0 top-1 -rotate-12" />
      <Image src="/preview/hoop-silver.png" alt="" width={72} height={72} className="absolute bottom-1 right-0 rotate-12" />
    </span>
  );
}

function CardArrow() {
  return (
    <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
      <ArrowUpRight size={18} />
    </span>
  );
}

/** Blob URL made and released by the effect, so a double-run effect never revokes the one on screen. */
function Thumb({ p }: { p: PreviewRecord }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(p.image);
    ref.current!.src = url;
    return () => URL.revokeObjectURL(url);
  }, [p.image]);
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img ref={ref} alt={p.title} className="aspect-[3/4] w-full rounded-2xl object-cover -scale-x-100" />
      <span className="absolute left-1.5 top-1.5 rounded-full bg-night/70 px-2 py-0.5 text-[11px] text-white">Simulated</span>
    </div>
  );
}

export default function PreviewHub() {
  const [saved, setSaved] = useState<PreviewRecord[]>([]);
  useEffect(() => {
    let alive = true;
    previews.all().then((p) => alive && setSaved(p));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <AppShell>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">Preview before you buy</h1>
      <p className="mt-1 text-ink/70">Try a product on half of you, keep the real you on the other half. Previews are simulations from YouCam AI, never measurements.</p>

      <div className="mt-5">
        <Reveal as="ul" stagger={0.09} className="grid grid-cols-2 gap-3">
          <li className="col-span-2">
            <Link href="/preview/shade" className="relative flex items-center gap-4 rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
              <ShadeArt />
              <span className="min-w-0 flex-1">
                <span className="block pr-9 text-lg leading-snug">Foundation shade swatch</span>
                <span className="mt-1.5 block text-sm text-ink/70">A shade on one half of your face, bare skin or a second shade on the other. See the seam before you buy.</span>
              </span>
              <CardArrow />
            </Link>
          </li>
          <li>
            <Link href="/preview/hair" className="relative flex h-full flex-col rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
              <HairArt />
              <span className="mt-3 block text-lg leading-snug">Hair colour, half and half</span>
              <span className="mt-1.5 block text-sm text-ink/70">The new colour on one side of your head, your current colour on the other.</span>
              <CardArrow />
            </Link>
          </li>
          <li>
            <Link href="/preview/earrings" className="relative flex h-full flex-col rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
              <HoopsArt />
              <span className="mt-3 block text-lg leading-snug">Gold or silver?</span>
              <span className="mt-1.5 block text-sm text-ink/70">One gold hoop on one ear, one silver hoop on the other, in the same photo.</span>
              <CardArrow />
            </Link>
          </li>
        </Reveal>
      </div>

      {saved.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-normal">Your previews</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {saved.map((p) => (
              <li key={p.id}>
                <Thumb p={p} />
                <p className="mt-1 truncate text-xs">{p.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
