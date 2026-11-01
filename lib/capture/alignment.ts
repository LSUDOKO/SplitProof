import { POSE_GATE } from "../config";
import type { Landmarks } from "../types";

export interface PoseReading {
  yaw: number;
  pitch: number;
  roll: number;
  /** Face width (contour 234 → 454) as a fraction of image width. */
  faceWidth: number;
  /** Distance of the face centre from the image centre, as a fraction of image width. */
  centreOffset: number;
  blink: number;
  jawOpen: number;
}

export type PoseIssue = "no_face" | "turned" | "tilted" | "too_far" | "too_close" | "off_centre" | "eyes_closed" | "mouth_open";

export const POSE_MESSAGES: Record<PoseIssue, string> = {
  no_face: "Show your whole face inside the outline.",
  turned: "Look straight at the camera.",
  tilted: "Keep your head level.",
  too_far: "Move closer so your face fills the outline.",
  too_close: "Move a little further away.",
  off_centre: "Centre your face inside the outline.",
  eyes_closed: "Keep your eyes open.",
  mouth_open: "Relax and close your mouth.",
};

/** Euler angles (degrees) from MediaPipe's column-major 4×4 facial transformation matrix. */
export function eulerFromMatrix(m: ArrayLike<number>): { yaw: number; pitch: number; roll: number } {
  const r = (row: number, col: number) => m[col * 4 + row];
  const deg = 180 / Math.PI;
  return {
    pitch: Math.atan2(r(2, 1), r(2, 2)) * deg,
    yaw: Math.asin(Math.max(-1, Math.min(1, -r(2, 0)))) * deg,
    roll: Math.atan2(r(1, 0), r(0, 0)) * deg,
  };
}

/** Landmarks in image pixels → face width and centring. */
export function framing(landmarks: Landmarks, width: number, height: number) {
  const [l, r] = [landmarks[234], landmarks[454]];
  const xs = landmarks.map((p) => p[0]);
  const ys = landmarks.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return {
    faceWidth: Math.hypot(r[0] - l[0], r[1] - l[1]) / width,
    centreOffset: Math.hypot(cx - width / 2, cy - height / 2) / width,
    box: { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) },
  };
}

/** Pose gate (docs/07 §2). Order = priority of the message shown to the user. */
export function evaluatePose(p: PoseReading | null): PoseIssue[] {
  if (!p) return ["no_face"];
  const g = POSE_GATE;
  const issues: PoseIssue[] = [];
  if (p.faceWidth < g.minFaceWidth) issues.push("too_far");
  if (p.faceWidth > g.maxFaceWidth) issues.push("too_close");
  if (p.centreOffset > g.maxCentreOffset) issues.push("off_centre");
  if (Math.abs(p.yaw) > g.maxYaw || Math.abs(p.pitch) > g.maxPitch) issues.push("turned");
  if (Math.abs(p.roll) > g.maxRoll) issues.push("tilted");
  if (p.blink > g.maxEyeBlink) issues.push("eyes_closed");
  if (p.jawOpen > g.maxJawOpen) issues.push("mouth_open");
  return issues;
}

/**
 * Mean distance between the live face and the baseline face after removing translation and scale
 * (centroid + face width), as a fraction of face width. Rotation is already gated by the pose check.
 */
export function ghostDistance(live: Landmarks, baseline: Landmarks, indices: number[]): number {
  const norm = (lm: Landmarks) => {
    const pts = indices.map((i) => lm[i]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const w = Math.hypot(lm[454][0] - lm[234][0], lm[454][1] - lm[234][1]) || 1;
    return pts.map((p) => [(p[0] - cx) / w, (p[1] - cy) / w]);
  };
  const a = norm(live);
  const b = norm(baseline);
  return a.reduce((s, p, k) => s + Math.hypot(p[0] - b[k][0], p[1] - b[k][1]), 0) / a.length;
}

/** MediaPipe face-oval landmark indices, in drawing order. */
export const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
