import type { HairTrial } from "../hair/model";
import { addDays } from "../trial/plan";

/** Demo SplitHair trial (badged "Demo data"): anti-frizz serum on the right side, levels improve by one. */
export function demoHairTrial(now = new Date().toISOString()): HairTrial {
  const start = addDays(now, -15);
  const c = (day: number, treated: 0 | 1 | 2 | 3, control: 0 | 1 | 2 | 3) => ({ at: addDays(start, day), day, isBaseline: day === 0, treated, control });
  return {
    id: "demo-hair-serum",
    product: "Anti-frizz hair serum",
    treatedSide: "right",
    createdAt: start,
    plannedDays: 14,
    isDemo: true,
    checks: [c(0, 2, 2), c(4, 2, 2), c(8, 1, 2), c(12, 1, 2), c(14, 1, 2)],
  };
}
