import { GOAL_DAYS, STATS } from "../config";
import type { ConcernKey, Confidence, Scan, Trial, Verdict } from "../types";
import { runSentinel, type SentinelResult } from "./sentinel";
import { concernSeries, effectPercent, mean, type ConcernSeries } from "./series";

export interface ConcernVerdict {
  concern: ConcernKey;
  verdict: Verdict;
  confidence: Confidence;
  /** Mean Δ over the last two scans. */
  m: number;
  sdc: number;
  effectPct: number;
  early: boolean;
  series: ConcernSeries | null;
}

export interface TrialVerdict {
  verdict: Verdict;
  confidence: Confidence;
  sentinel: SentinelResult;
  concerns: ConcernVerdict[];
  /** Days elapsed since trial start, from the latest scan. */
  days: number;
  plannedDays: number;
  /** Recommend extending by STATS.extendDays (borderline effect, return window allows). */
  extend: boolean;
  /** True when the trial can end now (verdict reached, early stop, or stop). */
  final: boolean;
  adherence?: number;
  reasons: string[];
}

export function confidenceOf(m: number, sd: number, n: number): Confidence {
  if (n === 0) return "Low";
  const z = Math.abs(m) / ((sd * Math.SQRT2) / Math.sqrt(n));
  return z >= 3 ? "High" : z >= 2 ? "Medium" : "Low";
}

export function judgeConcern(series: ConcernSeries | null, concern: ConcernKey, days: number, plannedDays: number): ConcernVerdict {
  const empty = { concern, confidence: "Low" as Confidence, m: 0, sdc: 0, effectPct: 0, early: false, series };
  if (!series || series.post.length < 2) return { ...empty, sdc: series?.baseline.sdc ?? 0, verdict: "insufficient_data" };
  const { sdc, sd } = series.baseline;
  const recent = series.post.slice(-2).map((p) => p.delta);
  const m = mean(recent);
  const base = { ...empty, m, sdc, effectPct: effectPercent(m), confidence: confidenceOf(m, sd, recent.length) };
  const minDays = GOAL_DAYS[concern].minDays;
  if (days < minDays) return { ...base, verdict: "insufficient_data" };
  const early = (dir: 1 | -1) => recent.every((d) => dir * d >= STATS.earlyStopMultiple * sdc);
  if (m <= -sdc && recent.every((d) => d <= -STATS.workingRecentFrac * sdc)) return { ...base, verdict: "working", early: early(-1) };
  if (m >= sdc && recent.every((d) => d >= STATS.workingRecentFrac * sdc)) return { ...base, verdict: "worse", early: early(1) };
  if (days >= plannedDays && Math.abs(m) < sdc) return { ...base, verdict: "no_difference" };
  return { ...base, verdict: "keep_going" };
}

const daysBetween = (fromIso: string, toIso: string) => Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);

/** Difference-in-differences verdict for the whole trial (docs/07 §7–9). The LLM only explains this. */
export function evaluateTrial(trial: Trial, scans: Scan[], todayIso = new Date().toISOString()): TrialVerdict {
  const sentinel = runSentinel(trial, scans);
  const days = scans.reduce((mx, s) => Math.max(mx, s.dayIndex), 0);
  const plannedDays = trial.plannedDays + (trial.extendedDays ?? 0);
  const concerns = trial.goals.map((c) => judgeConcern(concernSeries(scans, c, trial.treatedSide), c, days, plannedDays));
  const post = scans.filter((s) => !s.isBaseline && s.adherenceSinceLast !== undefined);
  const adherence = post.length ? mean(post.map((s) => s.adherenceSinceLast!)) : undefined;

  const reasons: string[] = [];
  const pick = (v: Verdict) => concerns.find((c) => c.verdict === v);
  let verdict: Verdict;
  let lead: ConcernVerdict | undefined;
  if (sentinel.level === "stop") {
    verdict = "stop";
    reasons.push(`Irritation sentinel: ${sentinel.reason}`);
  } else if ((lead = pick("worse"))) verdict = "worse";
  else if ((lead = pick("working"))) verdict = "working";
  else if (concerns.length && concerns.every((c) => c.verdict === "no_difference")) {
    verdict = "no_difference";
    lead = concerns[0];
  } else if (concerns.some((c) => c.verdict === "keep_going")) {
    verdict = "keep_going";
    lead = pick("keep_going");
  } else verdict = "insufficient_data";

  let confidence: Confidence = lead?.confidence ?? "Low";
  if (adherence !== undefined && adherence < 0.7 && confidence !== "Low") {
    confidence = confidence === "High" ? "Medium" : "Low";
    reasons.push(`Adherence ${Math.round(adherence * 100)}% lowered confidence`);
  }

  // Extension: borderline at planned end and the return window still has room (docs/07 §9).
  const atEnd = days >= plannedDays;
  const borderline = concerns.some((c) => Math.abs(c.m) >= STATS.extendLowerFrac * c.sdc && Math.abs(c.m) < c.sdc && c.verdict !== "insufficient_data");
  const roomLeft = !trial.returnDeadline || daysBetween(todayIso, trial.returnDeadline) >= STATS.extendDays;
  const extend = verdict === "no_difference" && atEnd && borderline && roomLeft && !trial.extendedDays;
  if (extend) {
    verdict = "keep_going";
    reasons.push(`Borderline effect at day ${days}: extend ${STATS.extendDays} days`);
  } else if (verdict === "no_difference" && borderline) {
    confidence = "Low";
    reasons.push("Borderline effect; no room to extend before the return deadline");
  }

  const final = verdict === "stop" || verdict === "no_difference" || ((verdict === "working" || verdict === "worse") && (atEnd || !!lead?.early));
  if (lead?.early && !atEnd) reasons.push("Clear effect on two consecutive scans: early stop");
  return { verdict, confidence, sentinel, concerns, days, plannedDays, extend, final, adherence, reasons };
}
