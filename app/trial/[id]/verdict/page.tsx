"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClaimCheck } from "@/components/ClaimCheck";
import { CopyBox } from "@/components/CopyBox";
import { DeadlineChip } from "@/components/DeadlineChip";
import { SplitFace } from "@/components/SplitFace";
import { ScanCompare } from "@/components/ScanCompare";
import { TrialState } from "@/components/TrialNotFound";
import { Button, ButtonLink, DemoBadge, Panel } from "@/components/ui";
import { draftMessage } from "@/lib/agent/drafts";
import { buildSummary } from "@/lib/agent/summary";
import { trials } from "@/lib/db";
import { CLASS_LABELS, gentlerAlternatives } from "@/lib/ingredients/classes";
import { STOP_ADVICE } from "@/lib/stats/sentinel";
import { mean } from "@/lib/stats/series";
import { VERDICT_TITLES, explainVerdict } from "@/lib/trial/explain";
import { useTrial } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

export default function VerdictPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, reload } = useTrial(id);
  const [panel, setPanel] = useState<"return" | "gentler" | "share" | null>(null);
  if (!data) return <TrialState loading={data === undefined} />;
  const { trial: t, scans, verdict: v } = data;
  const bad = v.verdict === "stop" || v.verdict === "worse";
  const h2h = t.mode === "head_to_head";
  const summary = buildSummary(t, scans, v);
  const imbalance = mean(scans.map((s) => s.meta.lightImbalance));
  const classes = t.products.A.ingredientClasses ?? [];

  const finish = async (status: "finished" | "stopped") => {
    await trials.put({ ...t, status });
    await reload();
  };

  return (
    <AppShell back={`/trial/${t.id}`} title="Verdict" action={t.isDemo ? <DemoBadge /> : undefined}>
      <Panel className="mt-2" tone={bad ? "stop" : v.verdict === "working" ? "good" : undefined}>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">
          {h2h && v.verdict === "no_difference"
            ? `${t.products.B?.name}${t.products.B?.price ? ` (₹${t.products.B.price})` : ""} did no better than ${t.products.A.name}${t.products.A.price ? ` (₹${t.products.A.price})` : ""}`
            : VERDICT_TITLES[v.verdict]}
        </h1>
        <p className="mt-3">{explainVerdict(t, v, false)}</p>
        {!bad && v.verdict !== "insufficient_data" && <p className="mt-2 text-sm text-muted">Confidence: {v.confidence}</p>}
      </Panel>

      {bad && (
        <Panel className="mt-3">
          <h2 className="font-semibold">What to do now</h2>
          <p className="mt-2">{STOP_ADVICE}</p>
          {classes.some((c) => c === "retinoid") && <p className="mt-2 text-sm text-muted">Check with a doctor before using retinoids if pregnant or planning pregnancy.</p>}
        </Panel>
      )}

      <Panel className="mt-3">
        <h2 className="font-semibold">Measured on your photos</h2>
        <div className="mt-4">
          {scans.some((s) => !s.isBaseline) && !t.isDemo ? <ScanCompare trialId={t.id} scans={scans} treatedSide={t.treatedSide} /> : <SplitFace treatedSide={t.treatedSide} size={160} treatedLabel={h2h ? t.products.A.name : "Treated"} controlLabel={h2h ? t.products.B?.name ?? "B" : "Control"} />}
        </div>
        <table className="mt-5 w-full text-left text-sm">
          <caption className="sr-only">Effect per concern</caption>
          <thead className="text-muted">
            <tr>
              <th className="pb-2 font-medium">Concern</th>
              <th className="pb-2 font-medium">Treated vs expected</th>
              <th className="pb-2 font-medium">Noise</th>
            </tr>
          </thead>
          <tbody>
            {v.concerns.map((c) => (
              <tr key={c.concern} className="border-t border-line">
                <td className="py-2.5 font-medium">{CONCERN_LABELS[c.concern]}</td>
                <td className={`py-2.5 ${c.verdict === "working" ? "text-good" : c.verdict === "worse" ? "text-stop" : ""}`}>
                  {c.series?.post.length ? `${c.effectPct > 0 ? `${c.effectPct}% less` : `${-c.effectPct}% more`}` : "—"}
                </td>
                <td className="py-2.5 text-muted">±{Math.round((1 - Math.exp(-c.sdc)) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">Scans</dt>
            <dd className="font-semibold">{scans.length}</dd>
          </div>
          <div>
            <dt className="text-muted">Adherence</dt>
            <dd className="font-semibold">{v.adherence === undefined ? "—" : `${Math.round(v.adherence * 100)}%`}</dd>
          </div>
          <div>
            <dt className="text-muted">Light balance</dt>
            <dd className="font-semibold">{(imbalance * 100).toFixed(1)}% avg</dd>
          </div>
        </dl>
        {v.reasons.length > 0 && <p className="mt-3 text-sm text-muted">{v.reasons.join(". ")}.</p>}
      </Panel>

      {!t.isDemo && !bad && <ClaimCheck trial={t} scans={scans} verdict={v} />}

      <div className="mt-4 flex flex-col gap-3">
        {t.returnDeadline && (
          <div>
            <DeadlineChip deadline={t.returnDeadline} />
          </div>
        )}
        {v.verdict === "working" && t.status !== "finished" && (
          <Button onClick={() => finish("finished")}>Keep it and close the trial</Button>
        )}
        <Button variant={bad || v.verdict === "no_difference" ? "primary" : "secondary"} onClick={() => setPanel(panel === "return" ? null : "return")}>
          Draft return request
        </Button>
        {panel === "return" && <CopyBox text={draftMessage(summary, "return_request")} label="Copy return request" />}
        {bad && (
          <>
            <Button variant="secondary" onClick={() => setPanel(panel === "gentler" ? null : "gentler")}>
              Try something gentler
            </Button>
            {panel === "gentler" && (
              <Panel>
                {classes.length > 0 && <p className="text-sm text-muted">This product contains: {classes.map((c) => CLASS_LABELS[c]).join(", ")}.</p>}
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {gentlerAlternatives(classes).map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                <ButtonLink href="/trial/new" className="mt-4 w-full">Start the next trial</ButtonLink>
              </Panel>
            )}
          </>
        )}
        <Button variant="secondary" onClick={() => setPanel(panel === "share" ? null : "share")}>
          Share result
        </Button>
        {panel === "share" && <CopyBox text={draftMessage(summary, "share_summary")} label="Copy summary" />}
        {bad && t.status !== "stopped" && (
          <Button variant="danger" onClick={() => finish("stopped").then(() => router.push("/trials"))}>
            Mark trial as stopped
          </Button>
        )}
        <ButtonLink href={`/trial/${t.id}/chat`} variant="ghost">
          Ask the assistant about this result
        </ButtonLink>
      </div>
    </AppShell>
  );
}
