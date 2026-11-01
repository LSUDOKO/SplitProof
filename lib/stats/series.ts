import { SPLIT, STATS } from "../config";
import type { ConcernKey, Scan, Side } from "../types";

const other = (s: Side): Side => (s === "left" ? "right" : "left");

/** Asymmetry index A = ln((burden_T + ε) / (burden_C + ε)); > 0 means the treated side shows more (docs/07 §5). */
export function asymmetry(burdens: Record<Side, number>, treatedSide: Side): number {
  const e = SPLIT.epsilon;
  return Math.log((burdens[treatedSide] + e) / (burdens[other(treatedSide)] + e));
}

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

export interface Baseline {
  a0: number;
  sd: number;
  /** Smallest detectable change between two measurements: 1.96·√2·sd. */
  sdc: number;
  n: number;
}

export function baselineOf(values: number[], sdFloor: number = STATS.sdFloor): Baseline {
  const sd = Math.max(stdev(values), sdFloor);
  return { a0: mean(values), sd, sdc: 1.96 * Math.SQRT2 * sd, n: values.length };
}

export interface SeriesPoint {
  scanId: string;
  day: number;
  a: number;
  /** Δ = A − A0: change in treated-vs-control relative to baseline. */
  delta: number;
  burdenTreated: number;
  burdenControl: number;
  wholeFaceRaw?: number;
}

export interface ConcernSeries {
  concern: ConcernKey;
  baseline: Baseline;
  post: SeriesPoint[];
}

/** Null when the concern has no baseline burdens (e.g. not requested or not splittable). */
export function concernSeries(scans: Scan[], concern: ConcernKey, treatedSide: Side): ConcernSeries | null {
  const sorted = [...scans].sort((x, y) => x.takenAt.localeCompare(y.takenAt));
  const base = sorted.filter((s) => s.isBaseline && s.burdens[concern]);
  if (base.length === 0) return null;
  const baseline = baselineOf(base.map((s) => asymmetry(s.burdens[concern]!, treatedSide)));
  const post = sorted
    .filter((s) => !s.isBaseline && s.burdens[concern])
    .map((s) => {
      const b = s.burdens[concern]!;
      const a = asymmetry(b, treatedSide);
      return {
        scanId: s.id,
        day: s.dayIndex,
        a,
        delta: a - baseline.a0,
        burdenTreated: b[treatedSide],
        burdenControl: b[other(treatedSide)],
        wholeFaceRaw: s.scores[concern]?.rawScore,
      };
    });
  return { concern, baseline, post };
}

/** Robust slope (median of pairwise slopes) of Δ over days — chart only, never the verdict. */
export function theilSen(points: { day: number; delta: number }[]): { slope: number; intercept: number } | null {
  if (points.length < 2) return null;
  const slopes: number[] = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      if (points[j].day !== points[i].day) slopes.push((points[j].delta - points[i].delta) / (points[j].day - points[i].day));
  if (slopes.length === 0) return null;
  const med = (xs: number[]) => {
    const s = [...xs].sort((p, q) => p - q);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const slope = med(slopes);
  return { slope, intercept: med(points.map((p) => p.delta - slope * p.day)) };
}

/** "about X% less detected area than expected": positive = treated side improved. */
export const effectPercent = (delta: number) => Math.round((1 - Math.exp(delta)) * 100);
