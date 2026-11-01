import type { ConcernKey } from "./types";

/** Starting thresholds from docs/07-algorithms.md. Recalibrate with real scans. */
export const LIGHT_GATE = {
  maxImbalanceBaseline: 0.12,
  maxImbalanceDrift: 0.06,
  minLuma: 70,
  maxClipped: 0.02,
  clipLevel: 250,
  minSharpness: 60,
} as const;

export const POSE_GATE = {
  maxYaw: 5,
  maxPitch: 7,
  maxRoll: 5,
  minFaceWidth: 0.6,
  maxFaceWidth: 0.8,
  maxCentreOffset: 0.08,
  maxEyeBlink: 0.4,
  maxJawOpen: 0.15,
  holdMs: 600,
} as const;

export const SPLIT = {
  /** Midline buffer band, as a fraction of face width, on each side. */
  bufferFrac: 0.04,
  epsilon: 0.002,
} as const;

export const STATS = {
  sdFloor: 0.05,
  workingRecentFrac: 0.75,
  earlyStopMultiple: 1.5,
  extendLowerFrac: 0.6,
  extendDays: 7,
  sentinelWatchFrac: 0.7,
  sentinelHarshK: 0.7,
} as const;

export const BASELINE_SCANS = 3;

export const GOAL_DAYS: Record<ConcernKey, { minDays: number; planned: number }> = {
  hd_moisture: { minDays: 3, planned: 7 },
  hd_oiliness: { minDays: 3, planned: 7 },
  hd_radiance: { minDays: 3, planned: 7 },
  hd_redness: { minDays: 5, planned: 14 },
  hd_acne: { minDays: 7, planned: 15 },
  hd_pore: { minDays: 14, planned: 28 },
  hd_texture: { minDays: 14, planned: 28 },
  hd_age_spot: { minDays: 28, planned: 56 },
  hd_dark_circle: { minDays: 7, planned: 21 },
  hd_eye_bag: { minDays: 7, planned: 21 },
  hd_tear_trough: { minDays: 7, planned: 21 },
  hd_wrinkle: { minDays: 7, planned: 21 },
  hd_skin_type: { minDays: 3, planned: 7 },
};

/** Days between follow-up scans after the baseline. */
export const SCAN_INTERVAL_DAYS = 2;
