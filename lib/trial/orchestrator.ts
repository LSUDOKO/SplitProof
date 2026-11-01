import { BASELINE_SCANS, STATS } from "../config";
import type { TrialVerdict } from "../stats/verdict";
import type { AgentEvent, Scan, Trial } from "../types";
import { CONCERN_LABELS } from "../youcam/concerns";
import { explainVerdict } from "./explain";
import { daysUntil } from "./plan";

export type NewEvent = Pick<AgentEvent, "trialId" | "kind" | "text">;

/**
 * Deterministic trial manager (docs/08, layer 1): runs after every scan, no LLM involved.
 * Returns the trial update and the activity-feed entries; the caller persists both.
 */
export function afterScan(trial: Trial, scans: Scan[], v: TrialVerdict, todayIso = new Date().toISOString()): { trial: Trial; events: NewEvent[] } {
  const ev = (kind: AgentEvent["kind"], text: string) => events.push({ trialId: trial.id, kind, text });
  const events: NewEvent[] = [];
  const next: Trial = { ...trial };
  const latest = scans.at(-1);
  if (!latest) return { trial, events };

  const baselineCount = scans.filter((s) => s.isBaseline).length;
  if (latest.isBaseline) {
    if (baselineCount >= BASELINE_SCANS && trial.status === "baseline") {
      next.status = "active";
      ev("scan_done", `Baseline complete (${baselineCount} scans). Your natural asymmetry and noise range are set. Start applying the product today.`);
    } else ev("scan_done", `Baseline scan ${baselineCount} of ${BASELINE_SCANS} saved. Move away and back, then scan again.`);
    return { trial: next, events };
  }

  if (v.sentinel.level === "stop") {
    next.status = "stopped";
    ev("sentinel_stop", `${explainVerdict(trial, v)}${trial.returnDeadline ? ` A return draft is ready (${daysUntil(trial.returnDeadline, todayIso)} days left).` : ""}`);
    return { trial: next, events };
  }
  if (v.sentinel.level === "watch") ev("sentinel_watch", `Day ${latest.dayIndex}: redness on the treated cheek is rising. Scan again in 1–2 days; stop at once if it burns or stings.`);

  if (v.extend) {
    next.extendedDays = STATS.extendDays;
    ev("extended", `Borderline effect at day ${v.days}. Trial extended by ${STATS.extendDays} days; your return window still allows it.`);
  } else if (v.final && (v.verdict === "working" || v.verdict === "worse" || v.verdict === "no_difference")) {
    next.status = "finished";
    const early = v.days < v.plannedDays;
    ev(early ? "early_stop" : "verdict", `${early ? "Clear result early. " : ""}Verdict: ${explainVerdict(trial, v)}`);
  } else {
    const lead = v.concerns[0];
    ev("scan_done", `Day ${latest.dayIndex} saved${lead ? `: ${CONCERN_LABELS[lead.concern].toLowerCase()} ${lead.effectPct >= 0 ? `${lead.effectPct}% lower` : `${-lead.effectPct}% higher`} on the treated side than expected` : ""}.`);
  }

  if (trial.returnDeadline && next.status === "active") {
    const left = daysUntil(trial.returnDeadline, todayIso);
    if (left <= 3 && left >= 0) ev("deadline_warning", `Return window closes in ${left} day${left === 1 ? "" : "s"}. Decide now with the current evidence, or plan to keep the product.`);
  }
  return { trial: next, events };
}
