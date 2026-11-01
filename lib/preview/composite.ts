import { toFaceFrame, type Midline } from "../split/midline";
import type { PixelBuffer, Side } from "../types";

/** Nearest-neighbour sample of `src` at photo coordinates, rescaled when sizes differ (VTO results can be 2 px narrower). */
function sampleInto(out: Uint8ClampedArray, o: number, src: PixelBuffer, x: number, y: number, w: number, h: number) {
  const sx = Math.min(src.width - 1, Math.floor((x * src.width) / w));
  const sy = Math.min(src.height - 1, Math.floor((y * src.height) / h));
  const i = (sy * src.width + sx) * 4;
  out[o] = src.data[i];
  out[o + 1] = src.data[i + 1];
  out[o + 2] = src.data[i + 2];
  out[o + 3] = 255;
}

/**
 * "Split everything": each of the user's halves comes from its own image, divided at the facial
 * midline (extended over the whole photo, so it splits hair too). Sources are keyed by the
 * USER's side; in an un-mirrored photo the user's left is image-right (docs/07 §0).
 */
export function splitComposite(width: number, height: number, midline: Midline, sources: Record<Side, PixelBuffer>): PixelBuffer {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const side: Side = toFaceFrame(midline, { x: x + 0.5, y: y + 0.5 }).d > 0 ? "left" : "right";
      sampleInto(out, (y * width + x) * 4, sources[side], x, y, width, height);
    }
  return { width, height, data: out };
}
