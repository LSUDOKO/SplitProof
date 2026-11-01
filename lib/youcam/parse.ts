import type { ConcernKey, ConcernScore } from "../types";
import type { OutputItemT } from "./schemas";

export interface ParsedConcern extends ConcernScore {
  key: ConcernKey;
  /** Mask URL per region ("whole" for concerns without regions). */
  masks: Record<string, string>;
}

export interface ParsedResult {
  concerns: ParsedConcern[];
  overall?: number;
  skinAge?: number;
}

/** Non-concern output items in the real response (tests/fixtures/youcam/cheeks-hd). */
const META_TYPES = new Set(["all", "skin_age", "resize_image"]);

/**
 * Parse json-format output. Real shape: one item per concern (`type: "hd_pore"`), with region
 * sub-scores as extra items carrying `region` ("cheek", "nose", "forehead", "whole").
 * raw_score is kept for comparisons; ui_score is display-only.
 */
export function parseOutput(output: OutputItemT[]): ParsedResult {
  const byKey = new Map<ConcernKey, ParsedConcern>();
  let overall: number | undefined;
  let skinAge: number | undefined;
  for (const item of output) {
    if (META_TYPES.has(item.type)) {
      if (item.type === "all" && typeof item.score === "number") overall = item.score;
      if (item.type === "skin_age" && typeof item.score === "number") skinAge = item.score;
      continue;
    }
    if (typeof item.raw_score !== "number") continue;
    const key = (item.type.startsWith("hd_") ? item.type : `hd_${item.type}`) as ConcernKey;
    const region = typeof item.region === "string" ? item.region : "whole";
    const score = { rawScore: item.raw_score, uiScore: item.ui_score ?? Math.round(item.raw_score) };
    const entry = byKey.get(key) ?? { key, rawScore: NaN, uiScore: NaN, masks: {} };
    if (region === "whole") Object.assign(entry, score);
    else entry.regions = { ...entry.regions, [region]: score };
    if (item.mask_urls?.[0]) entry.masks[region] = item.mask_urls[0];
    byKey.set(key, entry);
  }
  // Concerns that only came back as regions: fall back to the first region's score.
  for (const c of byKey.values())
    if (Number.isNaN(c.rawScore) && c.regions) Object.assign(c, Object.values(c.regions)[0]);
  return { concerns: [...byKey.values()], overall, skinAge };
}

/** Pick the mask that matches the trial zone (e.g. pore cheek mask), falling back to the whole-face one. */
export function pickMask(masks: Record<string, string>, region?: string): string | undefined {
  return (region && masks[region]) || masks.whole || Object.values(masks)[0];
}
