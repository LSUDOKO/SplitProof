import { GOAL_DAYS, SCAN_INTERVAL_DAYS } from "../config";
import type { ConcernKey, Side } from "../types";

/** Cryptographically random side so the user can't pick their "better" cheek (B2). */
export function randomSide(rand: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32): Side {
  return rand() < 0.5 ? "left" : "right";
}

/** Longest planned duration among the goals (B3). */
export const plannedDaysFor = (goals: ConcernKey[]) => Math.max(...goals.map((g) => GOAL_DAYS[g].planned), 7);

export const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString();
export const daysUntil = (iso: string, from = new Date().toISOString()) => Math.ceil((Date.parse(iso) - Date.parse(from)) / 86_400_000);

export interface PlanCheck {
  plannedDays: number;
  endDate: string;
  fitsDeadline: boolean;
  /** Days left between the trial end and the return deadline. */
  slack?: number;
}

export function checkPlan(goals: ConcernKey[], startIso: string, returnDeadline?: string): PlanCheck {
  const plannedDays = plannedDaysFor(goals);
  const endDate = addDays(startIso, plannedDays);
  if (!returnDeadline) return { plannedDays, endDate, fitsDeadline: true };
  const slack = daysUntil(returnDeadline, endDate);
  return { plannedDays, endDate, fitsDeadline: slack >= 0, slack };
}

/** Follow-up scan days after the baseline: every SCAN_INTERVAL_DAYS, ending on the planned day. */
export function scanSchedule(plannedDays: number): number[] {
  const days: number[] = [];
  for (let d = SCAN_INTERVAL_DAYS; d < plannedDays; d += SCAN_INTERVAL_DAYS) days.push(d);
  days.push(plannedDays);
  return days;
}

export function nextScanDay(plannedDays: number, doneDays: number[]): number | undefined {
  const last = Math.max(0, ...doneDays);
  return scanSchedule(plannedDays).find((d) => d > last);
}
