import type { IngredientClass, Trial, Verdict } from "../types";

const PATTERNS: Record<IngredientClass, RegExp> = {
  retinoid: /\b(retin(ol|al|yl)|adapalene|tretinoin|retinoic)/i,
  aha: /\b(glycolic|lactic|mandelic|malic|citric) acid/i,
  bha: /\bsalicylic acid|\bbetaine salicylate/i,
  benzoyl_peroxide: /benzoyl peroxide/i,
  vitamin_c: /\b(l-)?ascorbic acid/i,
  fragrance: /\b(parfum|fragrance|limonene|linalool|citronellol|geraniol)\b/i,
  essential_oil: /\b(\w+ )?(leaf|peel|flower|seed)? ?oil\b.*(lavandula|citrus|melaleuca|eucalyptus|mentha|rosmarinus)|\b(lavandula|melaleuca|eucalyptus|mentha piperita|rosmarinus)\b/i,
  alcohol_denat: /\balcohol denat|\bsd alcohol/i,
};

export const CLASS_LABELS: Record<IngredientClass, string> = {
  retinoid: "Retinoids",
  aha: "AHA exfoliants",
  bha: "BHA (salicylic acid)",
  benzoyl_peroxide: "Benzoyl peroxide",
  vitamin_c: "Vitamin C (L-ascorbic acid)",
  fragrance: "Fragrance",
  essential_oil: "Essential oils",
  alcohol_denat: "Drying alcohol",
};

export function parseInci(text: string): string[] {
  return text
    .split(/[,\n;]/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/\.$/, ""))
    .filter(Boolean);
}

export function classify(inci: string[]): IngredientClass[] {
  const joined = inci.join(", ");
  return (Object.keys(PATTERNS) as IngredientClass[]).filter((c) => PATTERNS[c].test(joined));
}

export interface IngredientFlag {
  name: string;
  seenStop: number;
  seenTotal: number;
}

type Outcome = "working" | "neutral" | "irritating";
const outcomeOf = (v: Verdict): Outcome | null =>
  v === "working" ? "working" : v === "stop" || v === "worse" ? "irritating" : v === "no_difference" ? "neutral" : null;

/**
 * Skin Passport pattern (docs/07 §11): flag an ingredient or class when it appeared in ≥ 2 irritating
 * products and in ≥ 66% of the finished products that contained it. Correlation, never causation.
 */
export function ingredientProfile(finished: { trial: Trial; verdict: Verdict }[]): IngredientFlag[] {
  const stats = new Map<string, { stop: number; total: number }>();
  for (const { trial, verdict } of finished) {
    const o = outcomeOf(verdict);
    if (!o) continue;
    const p = trial.products.A;
    const names = new Set([...(p.ingredientsInci ?? []), ...(p.ingredientClasses ?? []).map((c) => CLASS_LABELS[c])]);
    for (const n of names) {
      const s = stats.get(n) ?? { stop: 0, total: 0 };
      s.total++;
      if (o === "irritating") s.stop++;
      stats.set(n, s);
    }
  }
  return [...stats]
    .filter(([, s]) => s.stop >= 2 && s.stop / s.total >= 0.66)
    .map(([name, s]) => ({ name, seenStop: s.stop, seenTotal: s.total }))
    .sort((a, b) => b.seenStop - a.seenStop);
}

/** Gentler product types to look for after an irritating trial (classes, never brands). */
export function gentlerAlternatives(avoid: IngredientClass[]): string[] {
  const tips = ["Fragrance-free, short ingredient list", "Barrier-support moisturiser with ceramides, glycerin or panthenol"];
  if (avoid.some((c) => c === "retinoid")) tips.push("Bakuchiol or a low-strength retinoid used twice a week");
  if (avoid.some((c) => c === "aha" || c === "bha")) tips.push("PHA (gluconolactone) or a lower-percentage acid, every other night");
  if (avoid.includes("benzoyl_peroxide")) tips.push("Azelaic acid 10% or niacinamide 4–5% for blemishes");
  if (avoid.includes("vitamin_c")) tips.push("A vitamin C derivative (e.g. sodium ascorbyl phosphate)");
  return tips;
}
