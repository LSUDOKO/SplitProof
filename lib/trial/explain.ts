import { STOP_ADVICE } from "../stats/sentinel";
import type { TrialVerdict } from "../stats/verdict";
import type { Side, Trial, Verdict } from "../types";
import { CONCERN_LABELS } from "../youcam/concerns";

export const sideWord = (s: Side) => (s === "left" ? "left" : "right");
export const controlSide = (s: Side): Side => (s === "left" ? "right" : "left");

export const VERDICT_TITLES: Record<Verdict, string> = {
  working: "Working",
  no_difference: "No real difference",
  stop: "Stop using it",
  worse: "Treated side got worse",
  insufficient_data: "Not enough data yet",
  keep_going: "Too early to tell",
};

/** Plain-language verdict sentence built only from engine numbers. Used by UI and as the LLM fallback. */
export function explainVerdict(trial: Trial, v: TrialVerdict): string {
  const lead = v.concerns.find((c) => c.verdict === v.verdict) ?? v.concerns[0];
  const label = lead ? CONCERN_LABELS[lead.concern].toLowerCase() : "skin";
  const treated = `treated (${sideWord(trial.treatedSide)}) cheek`;
  const noise = lead ? Math.round((1 - Math.exp(-lead.sdc)) * 100) : 0;
  const h2h = trial.mode === "head_to_head";
  const a = trial.products.A.name;
  const b = trial.products.B?.name ?? "B";
  switch (v.verdict) {
    case "stop":
      return v.sentinel.reason === "symptoms"
        ? `You reported burning, stinging, itching or swelling. ${STOP_ADVICE}`
        : `Redness or breakouts on your ${treated} rose well above your normal range while the control side didn't. ${STOP_ADVICE}`;
    case "working":
      return h2h
        ? `${a} beat ${b}: about ${Math.abs(lead.effectPct)}% less ${label}-detected area on the ${a} side than expected. Confidence: ${v.confidence}.`
        : `${capital(label)}-detected area on your ${treated} is about ${Math.abs(lead.effectPct)}% lower than on your control side, relative to your baseline. Confidence: ${v.confidence}.`;
    case "worse":
      return h2h
        ? `${b} beat ${a}: the ${a} side showed about ${Math.abs(lead.effectPct)}% more ${label} than expected.`
        : `Your ${treated} shows about ${Math.abs(lead.effectPct)}% more ${label}-detected area than expected. Consider stopping.`;
    case "no_difference":
      return h2h
        ? `${b} did as well as ${a} — the difference is within your noise range (±${noise}%).`
        : `After ${v.days} days, both sides changed the same way. This product didn't measurably beat doing nothing (noise range ±${noise}%).`;
    case "keep_going":
      return v.extend
        ? `The effect is borderline at day ${v.days}. Your return window allows ${7} more days — keep going for a clearer answer.`
        : lead
          ? `Day ${v.days}: ${label} on your ${treated} is ${lead.m < 0 ? "trending down" : "not lower"} vs control (${Math.abs(lead.effectPct)}%), but within your noise range of ±${noise}%. Keep scanning.`
          : `Day ${v.days}: keep scanning on schedule.`;
    default:
      return `Not enough scans yet. Finish the baseline and at least two follow-up scans for a verdict.`;
  }
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
