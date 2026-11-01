import type { Scan } from "../types";
import type { ConcernKey, Side } from "../types";
import { asymmetry, mean } from "./series";

export interface AsymmetryNote {
  concern: ConcernKey;
  /** The user's side that shows more of the concern at baseline. */
  side: Side;
  pct: number;
}

/**
 * Natural Asymmetry Report (B8, docs/07 §6): concerns where one cheek already shows clearly more
 * at baseline (|A0| ≥ 0.25). Computed with "left" as reference so it's independent of the trial side.
 */
export function naturalAsymmetry(scans: Scan[], threshold = 0.25): AsymmetryNote[] {
  const base = scans.filter((s) => s.isBaseline);
  if (!base.length) return [];
  const keys = [...new Set(base.flatMap((s) => Object.keys(s.burdens) as ConcernKey[]))];
  return keys
    .map((concern) => {
      const vals = base.filter((s) => s.burdens[concern]).map((s) => asymmetry(s.burdens[concern]!, "left"));
      const a0 = mean(vals);
      return { concern, side: (a0 > 0 ? "left" : "right") as Side, pct: Math.round((Math.exp(Math.abs(a0)) - 1) * 100), a0 };
    })
    .filter((n) => Math.abs(n.a0) >= threshold)
    .sort((x, y) => Math.abs(y.a0) - Math.abs(x.a0))
    .map(({ concern, side, pct }) => ({ concern, side, pct }));
}
