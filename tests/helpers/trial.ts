import { SPLIT } from "@/lib/config";
import type { ConcernKey, Scan, Trial } from "@/lib/types";

export function makeTrial(over: Partial<Trial> = {}): Trial {
  return {
    id: "t1", mode: "single", products: { A: { name: "Serum" } }, treatedSide: "left", zone: "cheeks",
    goals: ["hd_acne"], startDate: "2026-11-01T08:00:00.000Z", plannedDays: 15, status: "active",
    isDemo: false, createdAt: "2026-11-01T08:00:00.000Z", ...over,
  };
}

/** Burdens whose asymmetry index (treated = left) equals `a` for each concern. */
export function burdensFor(values: Partial<Record<ConcernKey, number>>) {
  const control = 0.1;
  const e = SPLIT.epsilon;
  return Object.fromEntries(
    Object.entries(values).map(([k, a]) => [k, { left: (control + e) * Math.exp(a!) - e, right: control }]),
  ) as Scan["burdens"];
}

let n = 0;
export function makeScan(day: number, values: Partial<Record<ConcernKey, number>>, over: Partial<Scan> = {}): Scan {
  n++;
  const takenAt = new Date(Date.parse("2026-11-01T08:00:00.000Z") + day * 86_400_000 + n * 1000).toISOString();
  return {
    id: `s${n}`, trialId: "t1", takenAt, dayIndex: day, isBaseline: day === 0,
    meta: { width: 1080, height: 1440, device: "test", lightImbalance: 0.02, yaw: 0, pitch: 0, roll: 0, localHour: 8 },
    scores: {}, burdens: burdensFor(values), ...over,
  };
}

/** Three baseline scans with A values a0±noise, giving sd at the floor (0.05). */
export const baseline = (c: ConcernKey, a0 = 0.1) => [makeScan(0, { [c]: a0 }), makeScan(0, { [c]: a0 + 0.01 }), makeScan(0, { [c]: a0 - 0.01 })];
