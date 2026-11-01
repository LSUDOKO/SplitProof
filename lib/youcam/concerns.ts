import type { ConcernKey, Zone } from "../types";

export const CONCERN_SETS = {
  cheeks: ["hd_redness", "hd_acne", "hd_oiliness", "hd_age_spot", "hd_texture", "hd_pore", "hd_radiance", "hd_moisture"],
  under_eyes: ["hd_dark_circle", "hd_eye_bag", "hd_tear_trough", "hd_wrinkle", "hd_redness"],
  forehead: ["hd_redness", "hd_acne", "hd_oiliness", "hd_age_spot", "hd_texture", "hd_pore", "hd_radiance", "hd_moisture"],
} satisfies Record<Zone, ConcernKey[]>;

export type ConcernSetName = keyof typeof CONCERN_SETS;

/** Region-specific mask to prefer for each zone (docs/07 §4). */
export const ZONE_MASK_REGION: Partial<Record<Zone, Partial<Record<ConcernKey, string>>>> = {
  cheeks: { hd_pore: "cheek" },
  forehead: { hd_pore: "forehead", hd_wrinkle: "forehead" },
  under_eyes: { hd_wrinkle: "periocular" },
};

export const CONCERN_LABELS: Record<ConcernKey, string> = {
  hd_redness: "Redness",
  hd_acne: "Acne",
  hd_oiliness: "Oiliness",
  hd_age_spot: "Dark spots",
  hd_texture: "Texture",
  hd_pore: "Pores",
  hd_radiance: "Glow",
  hd_moisture: "Hydration",
  hd_dark_circle: "Dark circles",
  hd_eye_bag: "Eye bags",
  hd_tear_trough: "Tear trough",
  hd_wrinkle: "Fine lines",
  hd_skin_type: "Skin type",
};

/** HD skin-analysis unit cost by number of concerns (docs/05). */
export function unitCost(n: number): number {
  return n <= 4 ? 12 : n <= 8 ? 16 : n <= 12 ? 20 : 22;
}
