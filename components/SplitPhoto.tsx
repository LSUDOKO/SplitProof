"use client";
/* eslint-disable @next/next/no-img-element -- local blob: URLs, nothing for next/image to optimise */
import { useEffect, useMemo, useState } from "react";
import { fitMidline } from "@/lib/split/midline";
import type { ConcernKey, ScanMedia, Side } from "@/lib/types";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

function useObjectUrl(blob?: Blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url;
}

/** Sits over the photo, so it keeps its own dark backing and white text in both themes. */
function PhotoLabel({ treated, side, className }: { treated: boolean; side: Side; className: string }) {
  return (
    <span className={`absolute bottom-2 rounded-2xl bg-night/70 px-2.5 py-1 text-xs leading-tight text-white ${className}`}>
      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${treated ? "bg-treated" : "bg-control"}`} aria-hidden="true" />
      {treated ? "Treated" : "Control"}
      <span className="block">your {side}</span>
    </span>
  );
}

/**
 * A real scan photo, shown mirrored like a selfie, with the midline drawn and the chosen concern
 * mask overlaid. The treated half carries a light blue tint; the control half amber.
 */
export function SplitPhoto({ media, treatedSide, width, height }: { media: ScanMedia; treatedSide: Side; width: number; height: number }) {
  const keys = Object.keys(media.masks) as ConcernKey[];
  const [concern, setConcern] = useState<ConcernKey | undefined>(keys[0]);
  const img = useObjectUrl(media.image);
  const mask = useObjectUrl(concern ? media.masks[concern] : undefined);
  const line = media.landmarks ? fitMidline(media.landmarks as [number, number][]) : null;
  // Mirror: image x → width − x. User's left (image right) appears on screen left.
  const mx = (x: number) => width - x;
  const top = line ? mx(line.a * 0 + line.b) : width / 2;
  const bottom = line ? mx(line.a * height + line.b) : width / 2;
  const leftTreated = treatedSide === "left";
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-night" style={{ aspectRatio: `${width} / ${height}` }}>
        {img && <img src={img} alt="Your scan photo" className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />}
        {mask && <img src={mask} alt="" className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />}
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={`0,0 ${top},0 ${bottom},${height} 0,${height}`} fill={leftTreated ? "var(--color-treated)" : "var(--color-control)"} opacity="0.12" />
          <polygon points={`${top},0 ${width},0 ${width},${height} ${bottom},${height}`} fill={leftTreated ? "var(--color-control)" : "var(--color-treated)"} opacity="0.12" />
          <line x1={top} y1={0} x2={bottom} y2={height} stroke="white" strokeWidth={width / 300} strokeDasharray={`${width / 60} ${width / 80}`} />
        </svg>
        <PhotoLabel treated={leftTreated} side="left" className="left-2" />
        <PhotoLabel treated={!leftTreated} side="right" className="right-2" />
      </div>
      {keys.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Show detection mask">
          {keys.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === concern} onClick={() => setConcern(k)} className={`min-h-11 rounded-full px-4 text-sm transition-colors ${k === concern ? "bg-forest text-white" : "bg-raised text-ink shadow-[var(--shadow-soft)]"}`}>
              {CONCERN_LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
