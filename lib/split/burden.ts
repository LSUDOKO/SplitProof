import type { PixelBuffer, Side } from "../types";
import type { RoiIndex } from "./rois";

/** How detection strength is encoded in a mask: alpha (PNG) or brightness (JPG / opaque PNG). */
export type MaskChannel = "alpha" | "luma";

export function detectMaskChannel(mask: PixelBuffer): MaskChannel {
  const { data } = mask;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) return "alpha";
  return "luma";
}

/** Detection strength 0..255 at a flat mask pixel index. */
function strength(mask: PixelBuffer, i: number, channel: MaskChannel): number {
  const o = i * 4;
  const { data } = mask;
  if (channel === "alpha") return data[o + 3];
  return 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
}

/**
 * Fraction (0..1) of each side's ROI covered by the concern (docs/07 §4).
 * ROI indices are in photo pixels; masks of another size are sampled nearest-neighbour.
 */
export function maskBurden(mask: PixelBuffer, roi: RoiIndex, channel = detectMaskChannel(mask)): Record<Side, number> {
  const sx = mask.width / roi.width;
  const sy = mask.height / roi.height;
  const same = sx === 1 && sy === 1;
  const sum = (idx: Int32Array) => {
    if (idx.length === 0) return 0;
    let s = 0;
    for (const p of idx) {
      let mi = p;
      if (!same) {
        const x = p % roi.width;
        const y = (p - x) / roi.width;
        mi = Math.min(mask.height - 1, Math.floor(y * sy)) * mask.width + Math.min(mask.width - 1, Math.floor(x * sx));
      }
      s += strength(mask, mi, channel);
    }
    return s / (255 * idx.length);
  };
  return { left: sum(roi.left), right: sum(roi.right) };
}

/** A concern is splittable only if its mask varies spatially (docs/05: radiance/moisture may be uniform). */
export function isSplittable(mask: PixelBuffer, channel = detectMaskChannel(mask), minStd = 2): boolean {
  let n = 0;
  let mean = 0;
  let m2 = 0;
  const step = 4 * 7; // sample every 7th pixel
  for (let o = 0; o < mask.data.length; o += step) {
    const v = strength(mask, o / 4, channel);
    n++;
    const dlt = v - mean;
    mean += dlt / n;
    m2 += dlt * (v - mean);
  }
  return n > 1 && Math.sqrt(m2 / (n - 1)) >= minStd;
}
