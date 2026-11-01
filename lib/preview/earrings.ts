import type { Side } from "../types";

export type Metal = "gold" | "silver";

/**
 * Earring VTO places by IMAGE side: `earring_is_right_ear: true` lands on the image's right, which in
 * an un-mirrored selfie is the USER's LEFT ear (verified on tests/fixtures/youcam/earring).
 */
export const isImageRightEar = (userSide: Side) => userSide === "left";

export function earringObjects(goldOn: Side, ids: Record<Metal, string>) {
  const silverOn: Side = goldOn === "left" ? "right" : "left";
  return [
    { name: ids.gold, parameter: { earring_is_right_ear: isImageRightEar(goldOn), earring_need_remove_background: false } },
    { name: ids.silver, parameter: { earring_is_right_ear: isImageRightEar(silverOn), earring_need_remove_background: false } },
  ];
}

/** Undertone → which metal usually flatters (cosmetic rule of thumb, shown as a suggestion). */
export function metalHint(tone: "cool" | "neutral" | "warm"): string {
  if (tone === "warm") return "Your skin has a warm undertone, which gold usually flatters. See if the photo agrees.";
  if (tone === "cool") return "Your skin has a cool undertone, which silver usually flatters. See if the photo agrees.";
  return "Your undertone is neutral, so both metals can work. Trust the side you like.";
}
