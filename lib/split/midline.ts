import type { Landmarks, Point } from "../types";

/** MediaPipe Face Mesh indices lying on the facial midline, forehead → chin. */
export const MIDLINE_INDICES = [10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 17, 18, 200, 199, 175, 152] as const;

/**
 * Midline as x = a·y + b, fitted by least squares through the midline landmarks.
 * Fitting x on y (not y on x) keeps the line well-defined for an upright face.
 */
export interface Midline {
  a: number;
  b: number;
}

export function fitMidline(landmarks: Landmarks): Midline {
  const pts = MIDLINE_INDICES.map((i) => landmarks[i]).filter(Boolean);
  if (pts.length < 2) throw new Error("Not enough midline landmarks");
  const n = pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  let sxy = 0;
  let syy = 0;
  for (const [x, y] of pts) {
    sxy += (y - my) * (x - mx);
    syy += (y - my) ** 2;
  }
  const a = syy === 0 ? 0 : sxy / syy;
  return { a, b: mx - a * my };
}

/**
 * Face-aligned coordinates.
 * d: signed distance from the midline; d > 0 is image-right, which in an un-mirrored
 *    selfie is the USER's LEFT side (docs/07 §0).
 * v: position along the midline, increasing downwards (forehead → chin).
 */
export function toFaceFrame(m: Midline, p: Point): { d: number; v: number } {
  const norm = Math.sqrt(1 + m.a * m.a);
  return { d: (p.x - (m.a * p.y + m.b)) / norm, v: (m.a * p.x + p.y) / norm };
}
