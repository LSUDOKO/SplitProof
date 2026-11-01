/** The USER's left/right (mirror-corrected), never the image's. */
export type Side = "left" | "right";
export type Zone = "cheeks" | "under_eyes" | "forehead";
export type TrialMode = "single" | "head_to_head";
export type TrialStatus = "baseline" | "active" | "finished" | "stopped";
export type Verdict = "working" | "no_difference" | "stop" | "worse" | "insufficient_data" | "keep_going";
export type Confidence = "High" | "Medium" | "Low";

export type ConcernKey =
  | "hd_redness"
  | "hd_acne"
  | "hd_oiliness"
  | "hd_age_spot"
  | "hd_texture"
  | "hd_pore"
  | "hd_radiance"
  | "hd_moisture"
  | "hd_dark_circle"
  | "hd_eye_bag"
  | "hd_tear_trough"
  | "hd_wrinkle"
  | "hd_skin_type";

export type IngredientClass =
  | "retinoid"
  | "aha"
  | "bha"
  | "benzoyl_peroxide"
  | "vitamin_c"
  | "fragrance"
  | "essential_oil"
  | "alcohol_denat";

export interface Point {
  x: number;
  y: number;
}

/** 478 MediaPipe landmarks as [x, y] in image pixels. */
export type Landmarks = ReadonlyArray<readonly [number, number]>;

/** Minimal ImageData shape so pure functions run in Node tests. */
export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface Product {
  name: string;
  url?: string;
  price?: number;
  currency?: string;
  ingredientsInci?: string[];
  ingredientClasses?: IngredientClass[];
}

export interface Trial {
  id: string;
  mode: TrialMode;
  products: { A: Product; B?: Product };
  /** Single mode: side receiving A. Head-to-head: side receiving A (B goes on the other). */
  treatedSide: Side;
  zone: Zone;
  goals: ConcernKey[];
  startDate: string;
  plannedDays: number;
  extendedDays?: number;
  returnDeadline?: string;
  fitzpatrick?: 1 | 2 | 3 | 4 | 5 | 6;
  status: TrialStatus;
  isDemo: boolean;
  createdAt: string;
  /** What the user did with the verdict; powers the money-saved tracker. */
  decision?: "kept" | "returned";
}

export interface ScanContext {
  sleepHours?: number;
  stress?: 1 | 2 | 3 | 4 | 5;
  period?: boolean;
  /** Auto-filled from Open-Meteo when the user allows location (never affects the verdict). */
  humidity?: number;
  aqi?: number;
  tempC?: number;
  uvIndex?: number;
}

export interface ConcernScore {
  rawScore: number;
  uiScore: number;
  regions?: Record<string, { rawScore: number; uiScore: number }>;
}

export interface ScanMeta {
  width: number;
  height: number;
  device: string;
  lightImbalance: number;
  yaw: number;
  pitch: number;
  roll: number;
  localHour: number;
}

export interface Scan {
  id: string;
  trialId: string;
  takenAt: string;
  dayIndex: number;
  isBaseline: boolean;
  meta: ScanMeta;
  youcamTaskId?: string;
  scores: Partial<Record<ConcernKey, ConcernScore>>;
  /** Fraction (0..1) of each side's ROI covered by the concern mask. */
  burdens: Partial<Record<ConcernKey, Record<Side, number>>>;
  context?: ScanContext;
  /** 0..1 — share of days the product was applied since the last scan. */
  adherenceSinceLast?: number;
  symptoms?: boolean;
}

/** Binary blobs live in their own store so trial lists stay light. */
export interface ScanMedia {
  scanId: string;
  image: Blob;
  masks: Partial<Record<ConcernKey, Blob>>;
  landmarks?: number[][];
}

export interface AgentEvent {
  id: string;
  trialId: string;
  at: string;
  kind: "trial_created" | "scan_done" | "sentinel_watch" | "sentinel_stop" | "early_stop" | "extended" | "deadline_warning" | "verdict" | "missed_scan";
  text: string;
}

export interface PreviewRecord {
  id: string;
  kind: "shade" | "hair" | "earrings";
  createdAt: string;
  title: string;
  /** The split composite (simulated half | real half), JPEG. */
  image: Blob;
  note?: string;
}
