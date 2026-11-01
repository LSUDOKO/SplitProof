import { LIGHT_GATE } from "../config";
import type { RoiIndex } from "../split/rois";
import type { PixelBuffer } from "../types";

export type LightIssue = "side_light" | "too_dark" | "too_bright" | "blurry";

export const LIGHT_MESSAGES: Record<LightIssue, string> = {
  side_light: "Light is coming from one side. Turn so the light is in front of you.",
  too_dark: "Too dark — face a window or lamp.",
  too_bright: "Too bright — step back from the light.",
  blurry: "Hold still.",
};

export interface LightReading {
  imbalance: number;
  lumaLeft: number;
  lumaRight: number;
  clipped: number;
  sharpness: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const luma = (d: Uint8ClampedArray, o: number) => 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2];

function median(values: Float32Array): number {
  if (values.length === 0) return 0;
  const s = values.slice().sort();
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Variance of the 4-neighbour Laplacian over a box, on grayscale. Higher = sharper. */
export function laplacianVariance(img: PixelBuffer, box: Box): number {
  const x0 = Math.max(1, Math.floor(box.x));
  const y0 = Math.max(1, Math.floor(box.y));
  const x1 = Math.min(img.width - 2, Math.floor(box.x + box.width));
  const y1 = Math.min(img.height - 2, Math.floor(box.y + box.height));
  const g = (x: number, y: number) => luma(img.data, (y * img.width + x) * 4);
  let n = 0;
  let mean = 0;
  let m2 = 0;
  for (let y = y0; y <= y1; y += 2) {
    for (let x = x0; x <= x1; x += 2) {
      const l = g(x - 1, y) + g(x + 1, y) + g(x, y - 1) + g(x, y + 1) - 4 * g(x, y);
      n++;
      const dl = l - mean;
      mean += dl / n;
      m2 += dl * (l - mean);
    }
  }
  return n > 1 ? m2 / (n - 1) : 0;
}

export function readLight(img: PixelBuffer, roi: RoiIndex, faceBox: Box): LightReading {
  let clippedCount = 0;
  const side = (idx: Int32Array) => {
    const ys = new Float32Array(idx.length);
    idx.forEach((p, k) => {
      const o = p * 4;
      ys[k] = luma(img.data, o);
      const c = LIGHT_GATE.clipLevel;
      if (img.data[o] >= c || img.data[o + 1] >= c || img.data[o + 2] >= c) clippedCount++;
    });
    return median(ys);
  };
  const lumaLeft = side(roi.left);
  const lumaRight = side(roi.right);
  const meanY = (lumaLeft + lumaRight) / 2;
  const total = roi.left.length + roi.right.length;
  return {
    imbalance: meanY === 0 ? 1 : Math.abs(lumaLeft - lumaRight) / meanY,
    lumaLeft,
    lumaRight,
    clipped: total === 0 ? 0 : clippedCount / total,
    sharpness: laplacianVariance(img, faceBox),
  };
}

/**
 * Light Balance Gate (docs/07 §1). With a baseline mean imbalance, later scans are judged
 * relative to it, which tolerates natural pigment asymmetry.
 */
export function evaluateLight(r: LightReading, baselineImbalance?: number): LightIssue[] {
  const issues: LightIssue[] = [];
  const sideLit =
    baselineImbalance === undefined
      ? r.imbalance > LIGHT_GATE.maxImbalanceBaseline
      : Math.abs(r.imbalance - baselineImbalance) > LIGHT_GATE.maxImbalanceDrift;
  if (sideLit) issues.push("side_light");
  if (Math.min(r.lumaLeft, r.lumaRight) < LIGHT_GATE.minLuma) issues.push("too_dark");
  if (r.clipped > LIGHT_GATE.maxClipped) issues.push("too_bright");
  if (r.sharpness < LIGHT_GATE.minSharpness) issues.push("blurry");
  return issues;
}
