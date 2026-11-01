import type { Undertone } from "./color";

export const HAIR_SWATCH: Record<string, string> = {
  "Jet Black": "#0f0d0d",
  "Chocolate Brown": "#4b2e22",
  "Honey Blonde": "#c79b5b",
  "Platinum Blonde": "#e6dccb",
  "Ash Gray": "#8f8d8b",
  "Rose Gold": "#c98f85",
  Burgundy: "#5e1a2a",
  "Copper Red": "#a2482a",
  Lavender: "#a993c7",
  "Teal Blue": "#2f7c80",
};

const BY_UNDERTONE: Record<Undertone, { preset: string; why: string }[]> = {
  warm: [
    { preset: "Honey Blonde", why: "Golden tones echo the warm undertone of your skin." },
    { preset: "Copper Red", why: "Copper picks up the warmth in your skin instead of fighting it." },
    { preset: "Chocolate Brown", why: "A rich, warm brown is a safe, low-maintenance step." },
  ],
  cool: [
    { preset: "Ash Gray", why: "Ashy tones match a cool, pinker undertone." },
    { preset: "Burgundy", why: "Blue-based reds flatter cool undertones." },
    { preset: "Jet Black", why: "High contrast suits cool, clear skin tones." },
  ],
  neutral: [
    { preset: "Chocolate Brown", why: "Neutral skin carries both warm and cool browns." },
    { preset: "Rose Gold", why: "A soft blend of warm and cool that suits neutral undertones." },
    { preset: "Burgundy", why: "A deep red adds colour without clashing with neutral skin." },
  ],
};

/** Three hair colours to preview first, with plain-language reasons (cosmetic guidance, not rules). */
export function hairShortlist(tone: Undertone, currentHairName?: string) {
  const dark = currentHairName === "Black" || currentHairName === "Brown";
  return BY_UNDERTONE[tone].map((s) => ({
    ...s,
    note: dark && (s.preset === "Honey Blonde" || s.preset === "Ash Gray") ? "From dark hair this usually needs bleaching first." : undefined,
  }));
}
