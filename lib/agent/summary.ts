import { z } from "zod";
import { ingredientProfile } from "../ingredients/classes";
import type { TrialVerdict } from "../stats/verdict";
import { daysUntil } from "../trial/plan";
import { explainVerdict } from "../trial/explain";
import type { Scan, Trial } from "../types";
import { CONCERN_LABELS } from "../youcam/concerns";

/** Derived numbers only — no images ever leave the device for the agent (docs/10). */
export const AgentSummarySchema = z.object({
  trial: z.object({
    product: z.string().max(200),
    productB: z.string().max(200).optional(),
    mode: z.enum(["single", "head_to_head"]),
    treatedSide: z.enum(["left", "right"]),
    zone: z.string(),
    goals: z.array(z.string()).max(13),
    daysElapsed: z.number(),
    plannedDays: z.number(),
    returnDeadline: z.string().optional(),
    daysToDeadline: z.number().optional(),
    adherencePct: z.number().optional(),
    status: z.string(),
    isDemo: z.boolean(),
    ingredientClasses: z.array(z.string()).max(20),
  }),
  verdict: z.object({
    verdict: z.string(),
    confidence: z.string(),
    sentinel: z.string(),
    sentence: z.string().max(600),
    reasons: z.array(z.string()).max(10),
    concerns: z.array(z.object({ concern: z.string(), verdict: z.string(), effectPct: z.number(), noisePct: z.number(), confidence: z.string() })).max(13),
  }),
  measurements: z
    .array(
      z.object({
        concern: z.string(),
        points: z.array(z.object({ day: z.number(), delta: z.number(), treatedPct: z.number(), controlPct: z.number(), wholeFaceRaw: z.number().optional() })).max(60),
      }),
    )
    .max(13),
  context: z.array(z.object({ day: z.number(), sleepHours: z.number().optional(), stress: z.number().optional(), period: z.boolean().optional() })).max(60),
  ingredientFlags: z.array(z.object({ name: z.string(), seenStop: z.number(), seenTotal: z.number() })).max(30),
});
export type AgentSummary = z.infer<typeof AgentSummarySchema>;

const r2 = (x: number) => Math.round(x * 1000) / 1000;

export function buildSummary(trial: Trial, scans: Scan[], v: TrialVerdict, history: { trial: Trial; verdict: TrialVerdict["verdict"] }[] = []): AgentSummary {
  return {
    trial: {
      product: trial.products.A.name,
      productB: trial.products.B?.name,
      mode: trial.mode,
      treatedSide: trial.treatedSide,
      zone: trial.zone,
      goals: trial.goals.map((g) => CONCERN_LABELS[g]),
      daysElapsed: v.days,
      plannedDays: v.plannedDays,
      returnDeadline: trial.returnDeadline?.slice(0, 10),
      daysToDeadline: trial.returnDeadline ? daysUntil(trial.returnDeadline) : undefined,
      adherencePct: v.adherence === undefined ? undefined : Math.round(v.adherence * 100),
      status: trial.status,
      isDemo: trial.isDemo,
      ingredientClasses: trial.products.A.ingredientClasses ?? [],
    },
    verdict: {
      verdict: v.verdict,
      confidence: v.confidence,
      sentinel: v.sentinel.level + (v.sentinel.reason ? ` (${v.sentinel.reason})` : ""),
      sentence: explainVerdict(trial, v),
      reasons: v.reasons,
      concerns: v.concerns.map((c) => ({
        concern: CONCERN_LABELS[c.concern],
        verdict: c.verdict,
        effectPct: c.effectPct,
        noisePct: Math.round((1 - Math.exp(-c.sdc)) * 100),
        confidence: c.confidence,
      })),
    },
    measurements: v.concerns
      .filter((c) => c.series)
      .map((c) => ({
        concern: CONCERN_LABELS[c.concern],
        points: c.series!.post.map((p) => ({
          day: p.day,
          delta: r2(p.delta),
          treatedPct: Math.round(p.burdenTreated * 1000) / 10,
          controlPct: Math.round(p.burdenControl * 1000) / 10,
          wholeFaceRaw: p.wholeFaceRaw === undefined ? undefined : Math.round(p.wholeFaceRaw * 10) / 10,
        })),
      })),
    context: scans.filter((s) => s.context).map((s) => ({ day: s.dayIndex, ...s.context })),
    ingredientFlags: ingredientProfile(history),
  };
}
