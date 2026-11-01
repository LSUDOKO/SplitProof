import type { RoiIndex } from "../split/rois";
import type { PixelBuffer } from "../types";
import { deltaE2000, rgbToLab, type Lab } from "./color";

export type SeamVerdict = "blends" | "slightly_light" | "slightly_dark" | "too_light" | "too_dark";

export const SEAM_LABELS: Record<SeamVerdict, string> = {
  blends: "Blends well",
  slightly_light: "Slightly light",
  slightly_dark: "Slightly dark",
  too_light: "Too light",
  too_dark: "Too dark",
};

/** Mean CIELAB over ROI pixels, sampling `img` at photo coordinates (rescaled if sizes differ). */
export function meanLab(img: PixelBuffer, roi: RoiIndex): Lab {
  let r = 0;
  let g = 0;
  let b = 0;
  const idx = [...roi.left, ...roi.right];
  for (const p of idx) {
    const x = p % roi.width;
    const y = (p - x) / roi.width;
    const sx = Math.min(img.width - 1, Math.floor((x * img.width) / roi.width));
    const sy = Math.min(img.height - 1, Math.floor((y * img.height) / roi.height));
    const o = (sy * img.width + sx) * 4;
    r += img.data[o];
    g += img.data[o + 1];
    b += img.data[o + 2];
  }
  const n = Math.max(1, idx.length);
  return rgbToLab([r / n, g / n, b / n]);
}

export interface Seam {
  deltaE: number;
  /** Lightness change: > 0 the shade is lighter than your skin. */
  dL: number;
  verdict: SeamVerdict;
}

/**
 * How visible the line between foundation and bare skin would be: CIEDE2000 between your cheeks
 * with the shade on and the same cheeks bare. A shade that matches barely changes skin colour.
 * An estimate on a simulated image, never a measurement.
 */
export function seamScore(bare: PixelBuffer, withShade: PixelBuffer, roi: RoiIndex): Seam {
  const a = meanLab(bare, roi);
  const s = meanLab(withShade, roi);
  const deltaE = deltaE2000(a, s);
  const dL = s.L - a.L;
  const light = dL >= 0;
  const verdict: SeamVerdict = deltaE < 3 ? "blends" : deltaE < 6 ? (light ? "slightly_light" : "slightly_dark") : light ? "too_light" : "too_dark";
  return { deltaE: Math.round(deltaE * 10) / 10, dL: Math.round(dL * 10) / 10, verdict };
}
