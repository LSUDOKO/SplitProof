import { MIDLINE_INDICES } from "@/lib/split/midline";
import type { PixelBuffer } from "@/lib/types";

/** Template in face units: u ∈ [-1,1] (image left → right), v ∈ [-1,1] (top → chin). */
const TEMPLATE: Record<number, [number, number]> = {
  454: [1, 0], 234: [-1, 0],
  263: [0.6, -0.25], 33: [-0.6, -0.25],
  362: [0.2, -0.25], 133: [-0.2, -0.25],
  374: [0.4, -0.18], 145: [-0.4, -0.18],
  327: [0.18, 0.15], 98: [-0.18, 0.15],
  291: [0.3, 0.45], 61: [-0.3, 0.45],
  334: [0.4, -0.45], 105: [-0.4, -0.45],
  300: [0.7, -0.42], 70: [-0.7, -0.42],
};
MIDLINE_INDICES.forEach((i, k) => (TEMPLATE[i] = [0, -1 + (2 * k) / (MIDLINE_INDICES.length - 1)]));

export interface FaceSpec { cx: number; cy: number; w: number; h: number; rollDeg?: number }

export function syntheticLandmarks({ cx, cy, w, h, rollDeg = 0 }: FaceSpec): [number, number][] {
  const t = (rollDeg * Math.PI) / 180;
  const out: [number, number][] = Array.from({ length: 478 }, () => [cx, cy]);
  for (const [i, [u, v]] of Object.entries(TEMPLATE)) {
    const x = (u * w) / 2;
    const y = (v * h) / 2;
    out[+i] = [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
  }
  return out;
}

/** Fill an RGBA buffer from a per-pixel function. */
export function makeImage(width: number, height: number, px: (x: number, y: number) => [number, number, number, number]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) data.set(px(x, y), (y * width + x) * 4);
  return { width, height, data };
}
