import type { Side } from "../types";

/** YouCam hair frizziness levels (`mapping` 0–3) and their terms. */
export const FRIZZ_TERMS = ["Not frizzy", "Slightly frizzy", "Frizzy", "Extremely frizzy"] as const;
export type FrizzLevel = 0 | 1 | 2 | 3;

export interface HairCheck {
  at: string;
  day: number;
  isBaseline: boolean;
  treated: FrizzLevel;
  control: FrizzLevel;
}

/** SplitHair (docs/14 H3, beta): anti-frizz product on one side of the head, the other side as control. */
export interface HairTrial {
  id: string;
  product: string;
  treatedSide: Side;
  createdAt: string;
  plannedDays: number;
  checks: HairCheck[];
  isDemo: boolean;
}

export type HairVerdict = "baseline_needed" | "too_early" | "less_frizz" | "more_frizz" | "no_clear_difference" | "keep_going";

export const HAIR_VERDICT_TEXT: Record<HairVerdict, string> = {
  baseline_needed: "Take a baseline check before you start using the product.",
  too_early: "Too early to tell. Two check-ins after the baseline are needed.",
  less_frizz: "Less frizz on the treated side than on the control side, on two check-ins in a row.",
  more_frizz: "More frizz on the treated side than on the control side, on two check-ins in a row.",
  no_clear_difference: "No clear difference between the two sides.",
  keep_going: "Not clear yet. Keep checking in.",
};

/**
 * Ordinal difference-in-differences on a 4-level scale. Frizz levels are coarse, so a change only
 * counts when it holds a full level on two consecutive check-ins, and confidence is Low unless the
 * gap is two levels (docs/14: "show Low confidence unless differences are large and repeated").
 */
export function judgeHair(trial: HairTrial): { verdict: HairVerdict; confidence: "Low" | "Medium"; diffs: { day: number; diff: number }[] } {
  const base = trial.checks.filter((c) => c.isBaseline);
  if (!base.length) return { verdict: "baseline_needed", confidence: "Low", diffs: [] };
  const baseDiff = base.reduce((s, c) => s + c.treated - c.control, 0) / base.length;
  const diffs = trial.checks.filter((c) => !c.isBaseline).map((c) => ({ day: c.day, diff: c.treated - c.control - baseDiff }));
  if (diffs.length < 2) return { verdict: "too_early", confidence: "Low", diffs };
  const last = diffs.slice(-2).map((d) => d.diff);
  const confidence = last.every((d) => Math.abs(d) >= 2) ? "Medium" : "Low";
  if (last.every((d) => d <= -1)) return { verdict: "less_frizz", confidence, diffs };
  if (last.every((d) => d >= 1)) return { verdict: "more_frizz", confidence, diffs };
  const days = Math.max(...trial.checks.map((c) => c.day));
  return { verdict: days >= trial.plannedDays ? "no_clear_difference" : "keep_going", confidence: "Low", diffs };
}
