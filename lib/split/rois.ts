import { SPLIT } from "../config";
import type { Landmarks, Side, Zone } from "../types";
import { fitMidline, toFaceFrame, type Midline } from "./midline";

/** Landmark pairs as [user-left (image-right), user-right (image-left)]. */
const PAIRS = {
  contour: [454, 234],
  eyeOuter: [263, 33],
  eyeInner: [362, 133],
  lowerLid: [374, 145],
  ala: [327, 98],
  mouthCorner: [291, 61],
  brow: [334, 105],
  browOuter: [300, 70],
} as const;
const TOP = 10;
const CHIN = 152;

/** A mirror-symmetric band in face-frame coordinates; identical for both sides. */
export interface RoiBand {
  medial: number;
  lateral: number;
  vTop: number;
  vBottom: number;
}

export interface FaceGeometry {
  midline: Midline;
  faceWidth: number;
  faceHeight: number;
  band: RoiBand;
}

export function faceGeometry(landmarks: Landmarks, zone: Zone): FaceGeometry {
  const midline = fitMidline(landmarks);
  const f = (i: number) => {
    const [x, y] = landmarks[i];
    return toFaceFrame(midline, { x, y });
  };
  const pair = (k: keyof typeof PAIRS) => PAIRS[k].map(f);
  const [cL, cR] = pair("contour");
  const faceWidth = cL.d - cR.d;
  const faceHeight = f(CHIN).v - f(TOP).v;
  const buffer = SPLIT.bufferFrac * faceWidth;
  const absMax = (k: keyof typeof PAIRS) => Math.max(...pair(k).map((p) => Math.abs(p.d)));
  const absMin = (k: keyof typeof PAIRS) => Math.min(...pair(k).map((p) => Math.abs(p.d)));
  const vMax = (k: keyof typeof PAIRS) => Math.max(...pair(k).map((p) => p.v));
  const vMin = (k: keyof typeof PAIRS) => Math.min(...pair(k).map((p) => p.v));

  // Taking the inner bound of the two sides = intersection of one side with the other's reflection.
  let band: RoiBand;
  if (zone === "cheeks") {
    band = {
      medial: absMax("ala") + 0.02 * faceWidth,
      lateral: absMin("contour") - 0.04 * faceWidth,
      vTop: vMax("lowerLid") + 0.03 * faceHeight,
      vBottom: vMin("mouthCorner"),
    };
  } else if (zone === "under_eyes") {
    const top = vMax("lowerLid");
    band = { medial: absMax("eyeInner"), lateral: absMin("eyeOuter"), vTop: top, vBottom: top + 0.12 * faceHeight };
  } else {
    const browV = vMin("brow");
    const topV = f(TOP).v;
    band = {
      medial: 0,
      lateral: absMin("browOuter"),
      vTop: topV + 0.15 * (browV - topV),
      vBottom: browV - 0.02 * faceHeight,
    };
  }
  band.medial = Math.max(band.medial, buffer);
  return { midline, faceWidth, faceHeight, band };
}

export interface RoiIndex {
  width: number;
  height: number;
  /** Flat pixel indices (y·width + x) inside each side's ROI. */
  left: Int32Array;
  right: Int32Array;
}

/** Rasterise both ROIs once per photo; every concern mask is then summed over the same pixels. */
export function buildRoiIndex(width: number, height: number, geom: FaceGeometry): RoiIndex {
  const { midline, band } = geom;
  const left: number[] = [];
  const right: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { d, v } = toFaceFrame(midline, { x: x + 0.5, y: y + 0.5 });
      if (v < band.vTop || v > band.vBottom) continue;
      const ad = Math.abs(d);
      if (ad < band.medial || ad > band.lateral) continue;
      (d > 0 ? left : right).push(y * width + x);
    }
  }
  return { width, height, left: Int32Array.from(left), right: Int32Array.from(right) };
}

export function sideOfPoint(midline: Midline, x: number, y: number): Side {
  return toFaceFrame(midline, { x, y }).d > 0 ? "left" : "right";
}
