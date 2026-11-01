import type { ConcernKey } from "../types";

/** HD analysis concern → AI Skin Simulation parameter (docs/05). Moisture has no simulation. */
export const SIMULATION_PARAM: Partial<Record<ConcernKey, string>> = {
  hd_redness: "redness",
  hd_acne: "acne",
  hd_oiliness: "oiliness",
  hd_age_spot: "spots",
  hd_texture: "texture",
  hd_pore: "pores",
  hd_radiance: "radiance",
  hd_dark_circle: "dark_circle",
  hd_eye_bag: "eye_bags",
  hd_wrinkle: "wrinkle",
};

/** How strongly the brand's claim is worded → simulation intensity (0..1). */
export const CLAIM_STRENGTHS = [
  { label: "Subtle (“refines”, “softens”)", value: 0.3 },
  { label: "Visible (“reduces”, “clears”)", value: 0.6 },
  { label: "Dramatic (“eliminates”, “flawless”)", value: 1 },
] as const;

export function simulationParams(goals: ConcernKey[], intensity: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of goals) {
    const p = SIMULATION_PARAM[g];
    if (p) out[p] = Math.min(1, Math.max(0, intensity));
  }
  return out;
}
