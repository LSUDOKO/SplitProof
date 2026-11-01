"use client";
import { useEffect, useRef } from "react";
import { fitMidline } from "@/lib/split/midline";
import type { Landmarks, PixelBuffer } from "@/lib/types";

/**
 * A split composite drawn mirrored like a selfie (the user's left on screen-left), with the
 * midline and a permanent "Preview: simulated" badge (docs/14: previews are never measurements).
 */
export function SplitPreview({ image, landmarks, leftLabel, rightLabel }: { image: PixelBuffer; landmarks: Landmarks; leftLabel: string; rightLabel: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
    const m = fitMidline(landmarks);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = image.width / 300;
    ctx.setLineDash([image.width / 60, image.width / 80]);
    ctx.beginPath();
    ctx.moveTo(m.b, 0);
    ctx.lineTo(m.a * image.height + m.b, image.height);
    ctx.stroke();
  }, [image, landmarks]);
  return (
    <figure>
      <div className="relative overflow-hidden rounded-panel bg-ink">
        <canvas ref={ref} className="block h-auto w-full -scale-x-100" role="img" aria-label={`Split preview: ${leftLabel} on your left, ${rightLabel} on your right`} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold">Preview: simulated</span>
        <span className="absolute bottom-3 left-3 max-w-[45%] truncate rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-treated">{leftLabel}</span>
        <span className="absolute bottom-3 right-3 max-w-[45%] truncate rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-control">{rightLabel}</span>
      </div>
    </figure>
  );
}
