import { STATS } from "../config";
import type { IngredientClass, Scan, Trial } from "../types";
import { concernSeries } from "./series";

export type SentinelLevel = "ok" | "watch" | "stop";

export interface SentinelResult {
  level: SentinelLevel;
  reason?: "redness_spike" | "redness_sustained" | "acne_sustained" | "symptoms";
  scanId?: string;
}

const HARSH: IngredientClass[] = ["retinoid", "aha", "bha", "benzoyl_peroxide", "vitamin_c", "fragrance", "essential_oil", "alcohol_denat"];

/** Darker phototypes with harsh actives get a lower threshold (risk of post-inflammatory marks). */
export function sentinelK(trial: Pick<Trial, "fitzpatrick" | "products">): number {
  const classes = [...(trial.products.A.ingredientClasses ?? []), ...(trial.products.B?.ingredientClasses ?? [])];
  const harsh = classes.some((c) => HARSH.includes(c));
  return (trial.fitzpatrick ?? 0) >= 4 && harsh ? STATS.sentinelHarshK : 1;
}

/** Irritation sentinel (docs/07 §8), evaluated over every post-baseline scan in order. */
export function runSentinel(trial: Trial, scans: Scan[]): SentinelResult {
  const ordered = [...scans].filter((s) => !s.isBaseline).sort((x, y) => x.takenAt.localeCompare(y.takenAt));
  const symptomScan = ordered.find((s) => s.symptoms);
  if (symptomScan) return { level: "stop", reason: "symptoms", scanId: symptomScan.id };

  const k = sentinelK(trial);
  const red = concernSeries(scans, "hd_redness", trial.treatedSide);
  const acne = concernSeries(scans, "hd_acne", trial.treatedSide);
  const redBy = new Map(red?.post.map((p) => [p.scanId, p.delta]));
  const acneBy = new Map(acne?.post.map((p) => [p.scanId, p.delta]));
  const redSdc = red?.baseline.sdc ?? Infinity;
  const acneSdc = acne?.baseline.sdc ?? Infinity;

  let level: SentinelLevel = "ok";
  let prevWatch = false;
  let prevAcneHigh = false;
  let watchScan: string | undefined;
  for (const s of ordered) {
    const r = redBy.get(s.id);
    const a = acneBy.get(s.id);
    if (r !== undefined && r >= k * redSdc) return { level: "stop", reason: "redness_spike", scanId: s.id };
    const watch = r !== undefined && r >= STATS.sentinelWatchFrac * k * redSdc;
    if (watch && prevWatch) return { level: "stop", reason: "redness_sustained", scanId: s.id };
    const acneHigh = a !== undefined && a >= k * acneSdc;
    if (acneHigh && prevAcneHigh) return { level: "stop", reason: "acne_sustained", scanId: s.id };
    prevWatch = watch;
    prevAcneHigh = acneHigh;
    if (watch) watchScan = s.id;
  }
  // Only the latest scan decides whether we are still watching.
  if (prevWatch) level = "watch";
  return level === "watch" ? { level, reason: "redness_spike", scanId: watchScan } : { level };
}

export const STOP_ADVICE =
  "Stop using the product now. Rinse with water and use a plain moisturiser. See a doctor if it is painful, spreading, blistering or not settling in a few days.";
