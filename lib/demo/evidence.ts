/**
 * Real-World Evidence board (G1): seeded example data, always shown with a "Demo data" badge.
 * Pooling opt-in results across users needs a server store and is on the roadmap.
 */
export interface EvidenceRow {
  product: string;
  concern: string;
  trials: number;
  working: number;
  noDifference: number;
  stopped: number;
  byFitzpatrick: { group: string; trials: number; working: number }[];
}

export const EVIDENCE: EvidenceRow[] = [
  {
    product: "Clarifying niacinamide serum",
    concern: "Acne",
    trials: 37,
    working: 23,
    noDifference: 12,
    stopped: 2,
    byFitzpatrick: [
      { group: "I–III", trials: 15, working: 9 },
      { group: "IV–VI", trials: 22, working: 14 },
    ],
  },
  {
    product: "Glow exfoliating toner",
    concern: "Texture",
    trials: 24,
    working: 7,
    noDifference: 9,
    stopped: 8,
    byFitzpatrick: [
      { group: "I–III", trials: 10, working: 4 },
      { group: "IV–VI", trials: 14, working: 3 },
    ],
  },
  {
    product: "Budget gel moisturiser",
    concern: "Hydration",
    trials: 19,
    working: 13,
    noDifference: 6,
    stopped: 0,
    byFitzpatrick: [
      { group: "I–III", trials: 8, working: 5 },
      { group: "IV–VI", trials: 11, working: 8 },
    ],
  },
];
