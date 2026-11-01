"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppShell } from "@/components/AppShell";
import { ContextChart, DeltaChart } from "@/components/charts";
import { DeadlineChip } from "@/components/DeadlineChip";
import { TrialState } from "@/components/TrialNotFound";
import { ButtonLink, DemoBadge, Panel, SideTag } from "@/components/ui";
import { VerdictBadge } from "@/components/VerdictBadge";
import { BASELINE_SCANS } from "@/lib/config";
import { naturalAsymmetry } from "@/lib/stats/asymmetryReport";
import { explainVerdict, controlSide } from "@/lib/trial/explain";
import { addDays, nextScanDay } from "@/lib/trial/plan";
import { useTrial } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

export default function TrialDashboard() {
  const { id } = useParams<{ id: string }>();
  const { data } = useTrial(id);
  const [focus, setFocus] = useState(0);
  if (!data) return <TrialState loading={data === undefined} />;
  const { trial: t, scans, events, verdict: v } = data;
  const baselineDone = scans.filter((s) => s.isBaseline).length;
  const inBaseline = baselineDone < BASELINE_SCANS;
  const ended = t.status === "finished" || t.status === "stopped";
  const next = nextScanDay(v.plannedDays, scans.map((s) => s.dayIndex));
  const concern = v.concerns[focus] ?? v.concerns[0];
  const notes = Object.fromEntries(
    scans.filter((s) => s.context).map((s) => [s.dayIndex, [s.context!.sleepHours !== undefined && `${s.context!.sleepHours} h sleep`, s.context!.stress && `stress ${s.context!.stress}/5`, s.context!.period && "period"].filter(Boolean).join(", ")]),
  );
  const h2h = t.mode === "head_to_head";
  const asym = inBaseline || h2h ? [] : naturalAsymmetry(scans);

  return (
    <AppShell back="/trials" action={t.isDemo ? <DemoBadge /> : undefined}>
      <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">{h2h ? `${t.products.A.name} vs ${t.products.B?.name}` : t.products.A.name}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <SideTag kind="treated">{h2h ? `${t.products.A.name}: your ${t.treatedSide} cheek` : `Product: your ${t.treatedSide.toUpperCase()} cheek`}</SideTag>
        <SideTag kind="control">{h2h ? `${t.products.B?.name}: your ${controlSide(t.treatedSide)} cheek` : `Control: your ${controlSide(t.treatedSide)} cheek`}</SideTag>
        {!ended && <DeadlineChip deadline={t.returnDeadline} />}
      </div>

      <Panel className="mt-5" tone={v.verdict === "stop" || v.verdict === "worse" ? "stop" : v.verdict === "working" ? "good" : undefined}>
        <div className="flex items-center justify-between gap-2">
          <VerdictBadge verdict={inBaseline ? "insufficient_data" : v.verdict} />
          <span className="text-sm text-muted">
            Day {v.days} of {v.plannedDays}
          </span>
        </div>
        <p className="mt-3">{inBaseline ? `Baseline: scan ${baselineDone} of ${BASELINE_SCANS} done. Three scans today measure your natural asymmetry and noise.` : explainVerdict(t, v)}</p>
        {!inBaseline && (
          <ButtonLink href={`/trial/${t.id}/verdict`} variant="secondary" className="mt-4 w-full">
            {v.final || ended ? "See the verdict" : "See details"}
          </ButtonLink>
        )}
      </Panel>

      {!ended && (
        <Panel className="mt-3">
          <h2 className="font-semibold">{inBaseline ? "Next: baseline scan" : next !== undefined ? `Next scan: day ${next}` : "Final scan due"}</h2>
          <p className="mt-1 text-sm text-muted">
            {inBaseline
              ? "Move your head away and back between scans."
              : next !== undefined
                ? `${new Date(addDays(t.startDate, next)).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}, around the same time as your baseline.`
                : "Take your last scan to close the trial."}
          </p>
          <ButtonLink href={`/trial/${t.id}/scan`} className="mt-4 w-full">
            {t.isDemo ? "Try the guided camera" : "Take a scan"}
          </ButtonLink>
        </Panel>
      )}

      {concern?.series && concern.series.post.length > 0 && (
        <Panel className="mt-3">
          <h2 className="font-semibold">Treated vs control over time</h2>
          {v.concerns.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Concern">
              {v.concerns.map((c, i) => (
                <button
                  key={c.concern}
                  role="tab"
                  aria-selected={i === focus}
                  onClick={() => setFocus(i)}
                  className={`min-h-9 rounded-full px-3 text-sm font-medium ${i === focus ? "bg-ink text-white" : "border border-line"}`}
                >
                  {CONCERN_LABELS[c.concern]}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <DeltaChart series={concern.series} />
          </div>
        </Panel>
      )}

      {concern?.series && (
        <Panel className="mt-3">
          <h2 className="font-semibold">Why a bad night doesn&apos;t ruin the result</h2>
          <div className="mt-4">
            <ContextChart series={concern.series} notes={notes} />
          </div>
        </Panel>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3">
        <ButtonLink href={`/trial/${t.id}/chat`} variant="secondary">
          Ask the trial assistant
        </ButtonLink>
      </div>

      {asym.length > 0 && (
        <Panel className="mt-3">
          <h2 className="font-semibold">Your natural asymmetry</h2>
          <ul className="mt-2 space-y-1">
            {asym.map((n) => (
              <li key={n.concern}>
                Before the trial, your {n.side} cheek showed about {n.pct}% more {CONCERN_LABELS[n.concern].toLowerCase()} than your {n.side === "left" ? "right" : "left"}.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">
            Common everyday reasons: the side you sleep on, sun through a car window, the hand you hold your phone with. The baseline removes this, so it doesn&apos;t affect the verdict.
          </p>
        </Panel>
      )}

      <Panel className="mt-3">
        <h2 className="mb-4 font-semibold">Assistant activity</h2>
        <ActivityFeed events={events} />
      </Panel>
    </AppShell>
  );
}
