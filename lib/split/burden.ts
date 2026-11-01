import type { PixelBuffer, Side } from "../types";
import type { RoiIndex } from "./rois";

/**
 * Real YouCam HD masks (recorded in tests/fixtures/youcam) are display overlays:
 * - undetected skin/background is a dimming grey (#3D3D3D at a fixed alpha) or fully transparent;
 * - detected pixels carry the concern colour, with alpha encoding strength at a per-concern scale
 *   (pores ≈ 3/255, redness ≈ 11–24/255, acne spots opaque).
 * So detection = "coloured, non-grey, non-transparent", and strength = alpha normalised by the
 * mask's own 99th-percentile detected alpha.
 */
const BG = 61;
const BG_TOL = 4;

function isDetected(d: Uint8ClampedArray, o: number): boolean {
  if (d[o + 3] === 0) return false;
  const grey = Math.abs(d[o] - BG) <= BG_TOL && Math.abs(d[o + 1] - BG) <= BG_TOL && Math.abs(d[o + 2] - BG) <= BG_TOL;
  return !grey;
}

/** Per-pixel detection strength 0..255 for one mask. Computed once, reused for every ROI. */
export function strengthMap(mask: PixelBuffer): Uint8ClampedArray {
  const { data } = mask;
  const n = mask.width * mask.height;
  const hist = new Uint32Array(256);
  let detected = 0;
  for (let i = 0; i < n; i++) {
    if (isDetected(data, i * 4)) {
      hist[data[i * 4 + 3]]++;
      detected++;
    }
  }
  const out = new Uint8ClampedArray(n);
  if (detected === 0) return out;
  // 99th percentile of detected alpha, so one stray opaque pixel can't flatten the scale.
  let cum = 0;
  let p99 = 255;
  for (let a = 0; a < 256; a++) {
    cum += hist[a];
    if (cum >= 0.99 * detected) {
      p99 = Math.max(a, 1);
      break;
    }
  }
  for (let i = 0; i < n; i++) if (isDetected(data, i * 4)) out[i] = Math.min(255, Math.round((data[i * 4 + 3] / p99) * 255));
  return out;
}

export interface Strength {
  width: number;
  height: number;
  values: Uint8ClampedArray;
}

export const toStrength = (mask: PixelBuffer): Strength => ({ width: mask.width, height: mask.height, values: strengthMap(mask) });

/**
 * Fraction (0..1) of each side's ROI covered by the concern, weighted by strength (docs/07 §4).
 * ROI indices are in photo pixels; masks of another size are sampled nearest-neighbour.
 */
export function maskBurden(mask: Strength, roi: RoiIndex): Record<Side, number> {
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
      s += mask.values[mi];
    }
    return s / (255 * idx.length);
  };
  return { left: sum(roi.left), right: sum(roi.right) };
}

/** Splittable = the mask varies spatially (some, but not all, pixels detected). Near-clear skin still counts. */
export function isSplittable(mask: Strength): boolean {
  let detected = 0;
  for (const v of mask.values) if (v > 0) detected++;
  const share = detected / mask.values.length;
  return share > 0 && share < 0.98;
}
