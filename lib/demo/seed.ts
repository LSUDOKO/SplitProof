import { SPLIT } from "../config";
import { classify, parseInci } from "../ingredients/classes";
import { addDays } from "../trial/plan";
import type { AgentEvent, ConcernKey, Scan, ScanContext, Side, Trial } from "../types";

/**
 * Demo trials (I6), always shown with a "Demo data" badge. Day-by-day Δ values are synthetic;
 * burden magnitudes are in the range measured on the recorded fixture (tests/fixtures/youcam).
 */
interface DemoScanSpec {
  day: number;
  /** Δ per concern relative to baseline (log ratio). */
  delta: Partial<Record<ConcernKey, number>>;
  /** Shared shift on BOTH sides (bad sleep, weather): moves whole-face scores, cancels in Δ. */
  shared?: number;
  context?: ScanContext;
  adherence?: number;
  symptoms?: boolean;
}

interface DemoSpec {
  trial: Omit<Trial, "startDate" | "createdAt" | "isDemo" | "status" | "plannedDays"> & { plannedDays: number; status: Trial["status"] };
  startDaysAgo: number;
  deadlineInDays?: number;
  baselineA: Partial<Record<ConcernKey, number>>;
  control: Partial<Record<ConcernKey, number>>;
  scans: DemoScanSpec[];
  events: { day: number; kind: AgentEvent["kind"]; text: string }[];
}

const other = (s: Side): Side => (s === "left" ? "right" : "left");

function burdens(treated: Side, controlBurden: number, a: number) {
  const e = SPLIT.epsilon;
  return { [treated]: (controlBurden + e) * Math.exp(a) - e, [other(treated)]: controlBurden } as Record<Side, number>;
}

const product = (name: string, inci: string, price?: number) => {
  const list = parseInci(inci);
  return { name, price, currency: price ? "INR" : undefined, ingredientsInci: list, ingredientClasses: classify(list) };
};

const SPECS: DemoSpec[] = [
  {
    trial: {
      id: "demo-acne-serum",
      mode: "single",
      products: { A: product("Clarifying niacinamide serum", "Aqua, Niacinamide, Zinc PCA, Glycerin, Panthenol, Phenoxyethanol", 649) },
      treatedSide: "left",
      zone: "cheeks",
      goals: ["hd_acne", "hd_redness"],
      plannedDays: 15,
      status: "finished",
      fitzpatrick: 4,
    },
    startDaysAgo: 16,
    deadlineInDays: 14,
    baselineA: { hd_acne: 0.12, hd_redness: -0.3 },
    control: { hd_acne: 0.09, hd_redness: 0.16 },
    scans: [
      { day: 3, delta: { hd_acne: -0.02, hd_redness: 0.01 }, context: { sleepHours: 7 }, adherence: 1 },
      { day: 5, delta: { hd_acne: -0.07, hd_redness: -0.01 }, context: { sleepHours: 7.5 }, adherence: 1 },
      { day: 7, delta: { hd_acne: -0.12, hd_redness: 0.02 }, shared: 0.35, context: { sleepHours: 4, stress: 4, humidity: 41, aqi: 182 }, adherence: 0.9 },
      { day: 9, delta: { hd_acne: -0.19, hd_redness: 0 }, context: { sleepHours: 7 }, adherence: 1 },
      { day: 11, delta: { hd_acne: -0.24, hd_redness: -0.02 }, shared: 0.15, context: { sleepHours: 6, period: true }, adherence: 1 },
      { day: 13, delta: { hd_acne: -0.29, hd_redness: 0.01 }, context: { sleepHours: 7 }, adherence: 0.9 },
      { day: 15, delta: { hd_acne: -0.32, hd_redness: -0.01 }, context: { sleepHours: 8 }, adherence: 1 },
    ],
    events: [
      { day: 0, kind: "trial_created", text: "Side picked at random: product on your LEFT cheek. 15-day plan ends 6 days before your return deadline." },
      { day: 7, kind: "scan_done", text: "Day 7: whole-face acne score dipped after a 4-hour night, but it moved on both cheeks, so the treated-vs-control difference ignored it." },
      { day: 13, kind: "scan_done", text: "Day 13: treated cheek beyond your noise range on two scans in a row." },
      { day: 15, kind: "verdict", text: "Verdict: Working, high confidence. Keep it." },
    ],
  },
  {
    trial: {
      id: "demo-glycolic-toner",
      mode: "single",
      products: { A: product("Glow exfoliating toner", "Aqua, Glycolic Acid, Witch Hazel, Alcohol Denat., Parfum, Limonene", 899) },
      treatedSide: "right",
      zone: "cheeks",
      goals: ["hd_texture", "hd_redness"],
      plannedDays: 28,
      status: "stopped",
      fitzpatrick: 4,
    },
    startDaysAgo: 7,
    deadlineInDays: 9,
    baselineA: { hd_texture: 0.04, hd_redness: 0.03 },
    control: { hd_texture: 0.21, hd_redness: 0.15 },
    scans: [
      { day: 2, delta: { hd_texture: -0.02, hd_redness: 0.04 }, adherence: 1 },
      { day: 4, delta: { hd_texture: -0.03, hd_redness: 0.08 }, adherence: 1 },
      { day: 6, delta: { hd_texture: -0.04, hd_redness: 0.21 }, adherence: 1 },
    ],
    events: [
      { day: 0, kind: "trial_created", text: "Side picked at random: product on your RIGHT cheek. Patch-test reminder shown (glycolic acid, fragrance)." },
      { day: 4, kind: "sentinel_watch", text: "Day 4: redness on the treated cheek is rising (watch). Threshold lowered for Fitzpatrick IV with an exfoliating acid." },
      { day: 6, kind: "sentinel_stop", text: "Day 6: redness on the treated cheek rose above your normal range while the control cheek didn't. Trial stopped; return draft ready (9 days left)." },
    ],
  },
  {
    trial: {
      id: "demo-moisturiser-h2h",
      mode: "head_to_head",
      products: {
        A: product("Budget gel moisturiser", "Aqua, Glycerin, Hyaluronic Acid, Ceramide NP, Dimethicone", 350),
        B: product("Premium cream", "Aqua, Squalane, Glycerin, Ceramide NP, Shea Butter, Parfum", 3200),
      },
      treatedSide: "left",
      zone: "cheeks",
      goals: ["hd_moisture"],
      plannedDays: 7,
      status: "finished",
    },
    startDaysAgo: 8,
    baselineA: { hd_moisture: -0.02 },
    control: { hd_moisture: 0.12 },
    scans: [
      { day: 3, delta: { hd_moisture: 0.03 }, adherence: 1 },
      { day: 5, delta: { hd_moisture: -0.04 }, shared: -0.2, adherence: 1 },
      { day: 7, delta: { hd_moisture: 0.02 }, adherence: 1 },
    ],
    events: [
      { day: 0, kind: "trial_created", text: "Head-to-head: Budget gel on your LEFT cheek, Premium cream on your RIGHT." },
      { day: 7, kind: "verdict", text: "Verdict: no real difference. The ₹350 gel did as well as the ₹3,200 cream on your photos." },
    ],
  },
  {
    trial: {
      id: "demo-brightening-essence",
      mode: "single",
      products: { A: product("Brightening essence", "Aqua, Citric Acid, Ascorbic Acid, Parfum, Linalool, Alcohol Denat.", 1199) },
      treatedSide: "left",
      zone: "cheeks",
      goals: ["hd_age_spot", "hd_redness"],
      plannedDays: 56,
      status: "stopped",
    },
    startDaysAgo: 40,
    baselineA: { hd_age_spot: 0.05, hd_redness: 0 },
    control: { hd_age_spot: 0.18, hd_redness: 0.12 },
    scans: [
      { day: 3, delta: { hd_age_spot: 0, hd_redness: 0.16 } },
    ],
    events: [{ day: 3, kind: "sentinel_stop", text: "Day 3: redness spike on the treated cheek. Trial stopped." }],
  },
];

const ALL_CONCERNS = (spec: DemoSpec) => Object.keys(spec.baselineA) as ConcernKey[];

/** Raw score falls as the detected area rises; whole face = mean of both sides. */
const rawFrom = (b: Record<Side, number>) => Math.max(1, Math.min(100, 100 - ((b.left + b.right) / 2) * 180));

export function buildDemo(now = new Date().toISOString()) {
  const trials: Trial[] = [];
  const scans: Scan[] = [];
  const evts: AgentEvent[] = [];
  for (const spec of SPECS) {
    const start = addDays(now, -spec.startDaysAgo);
    const t: Trial = {
      ...spec.trial,
      startDate: start,
      createdAt: start,
      isDemo: true,
      returnDeadline: spec.deadlineInDays === undefined ? undefined : addDays(now, spec.deadlineInDays),
      // One past decision so the money-saved tracker has something honest to show in the demo.
      decision: spec.trial.id === "demo-brightening-essence" ? "returned" : undefined,
    };
    trials.push(t);
    const mk = (i: number, day: number, a: (c: ConcernKey) => number, s: Partial<DemoScanSpec> = {}): Scan => {
      const b: Scan["burdens"] = {};
      const scores: Scan["scores"] = {};
      for (const c of ALL_CONCERNS(spec)) {
        const ctrl = spec.control[c]! * Math.exp(s.shared ?? 0);
        b[c] = burdens(t.treatedSide, ctrl, a(c));
        const raw = rawFrom(b[c]!);
        scores[c] = { rawScore: Math.round(raw * 10) / 10, uiScore: Math.round(Math.min(100, raw + 8)) };
      }
      return {
        id: `${t.id}-s${i}`,
        trialId: t.id,
        takenAt: addDays(start, day + i * 0.0005),
        dayIndex: day,
        isBaseline: day === 0,
        meta: { width: 1080, height: 1440, device: "demo", lightImbalance: 0.03 + (i % 3) * 0.01, yaw: 1, pitch: 2, roll: 1, localHour: 8 },
        scores,
        burdens: b,
        context: s.context,
        adherenceSinceLast: s.adherence,
        symptoms: s.symptoms,
      };
    };
    const jitter = [0, 0.012, -0.012];
    jitter.forEach((j, i) => scans.push(mk(i, 0, (c) => spec.baselineA[c]! + j)));
    spec.scans.forEach((s, k) => scans.push(mk(3 + k, s.day, (c) => spec.baselineA[c]! + (s.delta[c] ?? 0), s)));
    spec.events.forEach((e, k) => evts.push({ id: `${t.id}-e${k}`, trialId: t.id, at: addDays(start, e.day + 0.01), kind: e.kind, text: e.text }));
  }
  return { trials, scans, events: evts };
}

export const DEMO_TRIAL_IDS = SPECS.map((s) => s.trial.id);
