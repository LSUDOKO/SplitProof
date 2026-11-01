import Link from "next/link";
import type { TrialVerdict, ConcernVerdict } from "@/lib/stats/verdict";
import { VERDICT_TITLES } from "@/lib/trial/explain";
import type { Verdict } from "@/lib/types";
import type { TrialData } from "@/lib/useTrial";
import { BASELINE_SCANS } from "@/lib/config";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";
import { CountUp, Ring } from "./motion";

const TONE: Record<Verdict, { chip: string; dot: string }> = {
  working: { chip: "bg-good-soft", dot: "bg-good" },
  stop: { chip: "bg-stop-soft", dot: "bg-stop" },
  worse: { chip: "bg-stop-soft", dot: "bg-stop" },
  no_difference: { chip: "bg-raised", dot: "bg-muted" },
  keep_going: { chip: "bg-treated-soft", dot: "bg-treated" },
  insufficient_data: { chip: "bg-raised", dot: "bg-muted" },
};

/** Soft tint, ink text and a coloured dot, so the text keeps full contrast in both themes. */
export function VerdictBadge({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  const tone = TONE[verdict];
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-2xl text-ink ${tone.chip} ${compact ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
      {VERDICT_TITLES[verdict]}
    </span>
  );
}

/** The concern behind the headline. On a stop, only the one that tripped the check (none for reported symptoms). */
export function leadConcern(v: TrialVerdict): ConcernVerdict | undefined {
  if (v.verdict !== "stop") return v.concerns.find((c) => c.verdict === v.verdict) ?? v.concerns[0];
  const tripped = v.sentinel.reason === "symptoms" ? undefined : v.sentinel.reason === "acne_sustained" ? "hd_acne" : "hd_redness";
  return v.concerns.find((c) => c.concern === tripped);
}

/** The engine only computes an effect from two follow-up scans. */
export const hasEffect = (c?: ConcernVerdict): c is ConcernVerdict => (c?.series?.post.length ?? 0) >= 2;

export const effectWords = (c: ConcernVerdict) => (c.effectPct === 0 ? "No change" : c.effectPct > 0 ? `${c.effectPct}% less` : `${-c.effectPct}% more`);

/** The same ± the engine's sentences quote. */
export const noisePercent = (sdc: number) => Math.round((1 - Math.exp(-sdc)) * 100);

const RING_WORD: Record<Verdict, string> = { working: "Working", no_difference: "Same", stop: "Stop", worse: "Worse", keep_going: "Testing", insufficient_data: "Testing" };

/**
 * Dark-green hero pill: big effect plus a progress ring holding the one-word verdict. `linked` is the
 * home version: names the product, carries the demo label (the dashboard has both in its header) and opens the trial.
 */
export function VerdictPill({ data, linked = false }: { data: TrialData; linked?: boolean }) {
  const { trial: t, scans, verdict: v } = data;
  const lead = leadConcern(v);
  const baselineDone = scans.filter((s) => s.isBaseline).length;
  const inBaseline = baselineDone < BASELINE_SCANS;
  const measured = !inBaseline && hasEffect(lead);
  const progress = inBaseline ? baselineDone / BASELINE_SCANS : v.days / Math.max(1, v.plannedDays);
  const day = inBaseline ? `Baseline scan ${baselineDone} of ${BASELINE_SCANS}` : `Day ${v.days} of ${v.plannedDays}`;
  const word = inBaseline ? "Baseline" : RING_WORD[v.verdict];
  const title = [lead && CONCERN_LABELS[lead.concern], linked && t.products.A.name].filter(Boolean).join(" · ") || VERDICT_TITLES[v.verdict];
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80">
          {day}
          {linked && t.isDemo && <span className="rounded-full border border-dashed border-white/70 px-1.5 text-white">Demo data</span>}
        </span>
      </span>
      {measured && (
        <span className="shrink-0 text-[2rem] font-light leading-none tabular-nums">
          {lead.effectPct > 0 ? "−" : lead.effectPct < 0 ? "+" : ""}
          <CountUp value={Math.abs(lead.effectPct)} />
          <span className="text-base">%</span>
        </span>
      )}
      <Ring progress={progress} size={60} color="white" label={`${day}, verdict ${word}`}>
        {word}
      </Ring>
    </>
  );
  const pill = "flex items-center gap-3 rounded-full bg-forest-deep py-3 pl-5 pr-3 text-white shadow-[var(--shadow-float)]";
  return linked ? (
    <Link href={`/trial/${t.id}`} className={pill}>
      {body}
    </Link>
  ) : (
    <div className={pill}>{body}</div>
  );
}
