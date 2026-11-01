"use client";
import { CalendarPlus, FileText, MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppShell } from "@/components/AppShell";
import { ContextChart, DeltaChart } from "@/components/charts";
import { contextNote } from "@/components/CheckIn";
import { DeadlineChip } from "@/components/DeadlineChip";
import { ProductArt } from "@/components/ProductArt";
import { SideChip } from "@/components/SplitFace";
import { TrialState } from "@/components/TrialNotFound";
import { Button, ButtonLink, DemoBadge, Panel } from "@/components/ui";
import { VerdictBadge, VerdictPill, leadConcern } from "@/components/VerdictBadge";
import { downloadIcsEvents } from "@/lib/clipboard";
import { BASELINE_SCANS } from "@/lib/config";
import { naturalAsymmetry } from "@/lib/stats/asymmetryReport";
import { explainVerdict, controlSide } from "@/lib/trial/explain";
import { addDays, daysUntil, nextScanDay, scanSchedule } from "@/lib/trial/plan";
import type { ConcernKey } from "@/lib/types";
import { useTrial, type TrialData } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

function NextScan({ data, baselineDone }: { data: TrialData; baselineDone: number }) {
  const { trial: t, scans, verdict: v } = data;
  const [saved, setSaved] = useState(false);
  const inBaseline = baselineDone < BASELINE_SCANS;
  const next = nextScanDay(v.plannedDays, scans.map((s) => s.dayIndex));

  const addAllToCalendar = () => {
    const now = Date.now();
    downloadIcsEvents(
      scanSchedule(v.plannedDays)
        .map((day) => ({ day, dateISO: addDays(t.startDate, day) }))
        .filter((e) => Date.parse(e.dateISO) > now)
        .map(({ day, dateISO }) => ({ dateISO, title: `SplitSide scan day ${day}: ${t.products.A.name}`, note: "Scan at about the same time as your baseline." })),
    );
    setSaved(true);
  };

  return (
    <Panel className="mt-3">
      <h2 className="text-lg font-normal">{inBaseline ? "Next: baseline scan" : next !== undefined ? `Next scan: day ${next}` : "Final scan due"}</h2>
      <p className="mt-1 text-sm text-ink/70">
        {inBaseline
          ? "Move your head away and back between scans."
          : next !== undefined
            ? `${new Date(addDays(t.startDate, next)).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}, around the same time as your baseline.`
            : "Take your last scan to close the trial."}
      </p>
      <ButtonLink href={`/trial/${t.id}/scan`} className="mt-4 w-full">
        {t.isDemo ? "Try the guided camera" : "Take a scan"}
      </ButtonLink>
      {daysUntil(addDays(t.startDate, v.plannedDays)) > 0 && (
        <Button variant="secondary" className="mt-3 w-full" onClick={addAllToCalendar}>
          <CalendarPlus size={18} aria-hidden="true" />
          <span aria-live="polite">{saved ? "Saved. Open the file to add it" : "Add all scans to calendar"}</span>
        </Button>
      )}
    </Panel>
  );
}

export default function TrialDashboard() {
  const { id } = useParams<{ id: string }>();
  const { data } = useTrial(id);
  const [picked, setPicked] = useState<ConcernKey>();
  if (!data) return <TrialState loading={data === undefined} />;
  const { trial: t, scans, events, verdict: v } = data;
  const baselineDone = scans.filter((s) => s.isBaseline).length;
  const inBaseline = baselineDone < BASELINE_SCANS;
  const ended = t.status === "finished" || t.status === "stopped";
  const concern = v.concerns.find((c) => c.concern === picked) ?? leadConcern(v) ?? v.concerns[0];
  const notes = Object.fromEntries(scans.filter((s) => s.context).map((s) => [s.dayIndex, contextNote(s.context!)]));
  const h2h = t.mode === "head_to_head";
  const asym = inBaseline || h2h ? [] : naturalAsymmetry(scans);

  return (
    <AppShell back="/trials" title="Trial" action={t.isDemo ? <DemoBadge /> : undefined}>
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 break-words text-[1.7rem] font-normal leading-tight tracking-tight">{h2h ? `${t.products.A.name} vs ${t.products.B?.name}` : t.products.A.name}</h2>
        <span className="flex shrink-0 drop-shadow-[0_12px_12px_rgb(15_35_15/0.25)]" aria-hidden="true">
          <ProductArt name={t.products.A.name} size={h2h ? 72 : 88} />
          {h2h && <ProductArt name={t.products.B?.name} size={72} className="-ml-6" />}
        </span>
      </div>

      <div className="mt-3">
        <VerdictPill data={data} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <SideChip kind="treated">{h2h ? `${t.products.A.name}: your ${t.treatedSide} cheek` : `Product: your ${t.treatedSide.toUpperCase()} cheek`}</SideChip>
        <SideChip kind="control">{h2h ? `${t.products.B?.name}: your ${controlSide(t.treatedSide)} cheek` : `Control: your ${controlSide(t.treatedSide)} cheek`}</SideChip>
        {!ended && <DeadlineChip deadline={t.returnDeadline} />}
      </div>

      <Panel className="mt-3" tone={v.verdict === "stop" || v.verdict === "worse" ? "stop" : v.verdict === "working" ? "good" : undefined}>
        <VerdictBadge verdict={inBaseline ? "insufficient_data" : v.verdict} />
        <p className="mt-3">{inBaseline ? `Baseline: scan ${baselineDone} of ${BASELINE_SCANS} done. Three scans today measure your natural asymmetry and noise.` : explainVerdict(t, v)}</p>
        {!inBaseline && (
          <ButtonLink href={`/trial/${t.id}/verdict`} variant="secondary" className="mt-4 w-full">
            {v.final || ended ? "See the verdict" : "See details"}
          </ButtonLink>
        )}
      </Panel>

      {!ended && <NextScan data={data} baselineDone={baselineDone} />}

      {concern?.series && concern.series.post.length > 0 && (
        <Panel className="mt-3">
          <h2 className="text-lg font-normal">Treated vs control over time</h2>
          {v.concerns.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Concern to chart">
              {v.concerns.map((c) => (
                <button
                  key={c.concern}
                  type="button"
                  aria-pressed={c === concern}
                  onClick={() => setPicked(c.concern)}
                  className={`min-h-11 rounded-full px-4 text-sm transition-colors ${c === concern ? "bg-forest text-white" : "bg-raised text-ink shadow-[var(--shadow-soft)]"}`}
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

      {concern?.series && <ContextChart series={concern.series} notes={notes} />}

      <div className="mt-3 grid grid-cols-1 gap-3">
        <ButtonLink href={`/trial/${t.id}/chat`} variant="secondary">
          <MessageCircle size={18} aria-hidden="true" />
          Ask the trial assistant
        </ButtonLink>
        <ButtonLink href={`/trial/${t.id}/report`} variant="secondary">
          <FileText size={18} aria-hidden="true" />
          Report for your dermatologist
        </ButtonLink>
      </div>

      {asym.length > 0 && (
        <Panel className="mt-3">
          <h2 className="text-lg font-normal">Your natural asymmetry</h2>
          <ul className="mt-2 space-y-1">
            {asym.map((n) => (
              <li key={n.concern}>
                Before the trial, your {n.side} cheek showed about {n.pct}% more {CONCERN_LABELS[n.concern].toLowerCase()} than your {n.side === "left" ? "right" : "left"}.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink/70">
            Common everyday reasons: the side you sleep on, sun through a car window, the hand you hold your phone with. The baseline removes this, so it doesn&apos;t affect the verdict.
          </p>
        </Panel>
      )}

      <Panel className="mt-3">
        <h2 className="mb-4 text-lg font-normal">Assistant activity</h2>
        <ActivityFeed events={events} />
      </Panel>
    </AppShell>
  );
}
