"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, FileText, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClaimCheck } from "@/components/ClaimCheck";
import { CopyBox } from "@/components/CopyBox";
import { DeadlineChip } from "@/components/DeadlineChip";
import { CountUp, Ring } from "@/components/motion";
import { ScanCompare } from "@/components/ScanCompare";
import { ShareTools } from "@/components/ShareTools";
import { SplitFace } from "@/components/SplitFace";
import { TrialState } from "@/components/TrialNotFound";
import { Button, ButtonLink, DemoBadge, Panel } from "@/components/ui";
import { effectWords, hasEffect, leadConcern, noisePercent } from "@/components/VerdictBadge";
import { draftMessage } from "@/lib/agent/drafts";
import { buildSummary } from "@/lib/agent/summary";
import { trials } from "@/lib/db";
import { CLASS_LABELS, gentlerAlternatives } from "@/lib/ingredients/classes";
import { STOP_ADVICE } from "@/lib/stats/sentinel";
import { mean } from "@/lib/stats/series";
import type { TrialVerdict } from "@/lib/stats/verdict";
import { VERDICT_TITLES, explainVerdict } from "@/lib/trial/explain";
import type { Trial } from "@/lib/types";
import { useTrial, type TrialData } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

const isBad = (v: TrialVerdict) => v.verdict === "stop" || v.verdict === "worse";

function headline(t: Trial, v: TrialVerdict) {
  const { A, B } = t.products;
  if (t.mode === "head_to_head") {
    if (v.verdict === "no_difference") return `${B?.name}${B?.price ? ` (₹${B.price})` : ""} did no better than ${A.name}${A.price ? ` (₹${A.price})` : ""}`;
    if (v.verdict === "working") return `${A.name} beat ${B?.name}`;
    if (v.verdict === "worse") return `${B?.name} beat ${A.name}`;
  }
  return VERDICT_TITLES[v.verdict];
}

/** The big moment. Stop and worse stay calm: a red card, no bounce, no pulse, and no number the engine didn't compute. */
function VerdictHero({ trial: t, verdict: v }: { trial: Trial; verdict: TrialVerdict }) {
  const bad = isBad(v);
  const lead = leadConcern(v);
  const measured = v.verdict !== "insufficient_data" && hasEffect(lead);
  const effect = measured ? Math.abs(lead.effectPct) : 0;
  const direction = !measured ? "" : lead.effectPct === 0 ? "change in detected area" : lead.effectPct > 0 ? "less detected area" : "more detected area";
  const day = `day ${v.days} of ${v.plannedDays}`;
  const soft = bad ? "text-ink/70" : "text-white/80";
  return (
    <section className={`relative overflow-hidden rounded-[2.25rem] px-6 pb-7 pt-6 text-center shadow-[var(--shadow-float)] ${bad ? "bg-stop-soft text-ink" : "bg-forest-deep text-white"}`}>
      <p data-hero="eyebrow" className={`text-sm ${soft}`}>
        {lead ? `${CONCERN_LABELS[lead.concern]} · ${day}` : `Your verdict · ${day}`}
      </p>
      <div data-hero="ring" className="relative mx-auto mt-4 w-fit">
        {v.verdict === "working" && (
          <>
            <span data-hero="pulse" className="absolute inset-0 rounded-full border-2 border-white/70 opacity-0" aria-hidden="true" />
            <span data-hero="pulse" className="absolute inset-0 rounded-full border-2 border-white/70 opacity-0" aria-hidden="true" />
          </>
        )}
        <Ring
          progress={measured ? effect / 100 : v.days / Math.max(1, v.plannedDays)}
          size={168}
          stroke={7}
          color={bad ? "var(--color-stop)" : "white"}
          label={measured ? `About ${effect}% ${direction} on the ${t.mode === "head_to_head" ? `${t.products.A.name} side` : "treated side"}` : `Day ${v.days} of ${v.plannedDays}`}
        >
          {measured ? (
            <span className="block w-32">
              <span className="block text-5xl font-light leading-none tabular-nums">
                <CountUp value={effect} duration={1.4} />
                <span className="text-2xl">%</span>
              </span>
              <span className="mt-1.5 block text-sm leading-tight">{direction}</span>
            </span>
          ) : (
            <span className="text-2xl font-light">Day {v.days}</span>
          )}
        </Ring>
      </div>
      <h2 data-hero="title" className={`mt-5 text-3xl font-normal leading-tight tracking-tight ${bad ? "text-stop" : ""}`}>
        {headline(t, v)}
      </h2>
      <p data-hero="copy" className="mt-3">{explainVerdict(t, v, false).replace(/ Confidence: \w+\.$/, "")}</p>
      {!bad && v.verdict !== "insufficient_data" && (
        <p data-hero="copy" className="mt-4">
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm">Confidence: {v.confidence}</span>
        </p>
      )}
    </section>
  );
}

function StopAdvice({ trial: t, retinoid }: { trial: Trial; retinoid: boolean }) {
  return (
    <section className="mt-3 rounded-panel border-2 border-stop bg-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="flex items-center gap-2 text-xl font-normal">
        <ShieldAlert size={22} className="shrink-0 text-stop" aria-hidden="true" />
        What to do now
      </h2>
      <ol className="mt-3 space-y-3">
        {(STOP_ADVICE.match(/[^.]+\./g) ?? []).map((line, i) => (
          <li key={line} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stop-soft text-sm" aria-hidden="true">{i + 1}</span>
            {line.trim()}
          </li>
        ))}
      </ol>
      {retinoid && <p className="mt-3 text-sm text-ink/70">Check with a doctor before using retinoids if pregnant or planning pregnancy.</p>}
      <ButtonLink href={`/trial/${t.id}/report`} variant="secondary" className="mt-4 w-full">
        <FileText size={18} aria-hidden="true" />
        Report to show a doctor or pharmacist
      </ButtonLink>
    </section>
  );
}

const DECISIONS = [
  { value: "kept", label: "Keep it", saved: "Saved: you kept it." },
  { value: "returned", label: "I returned it", saved: "Saved: you returned it." },
] as const;

function DecisionControl({ trial: t, onSaved }: { trial: Trial; onSaved: () => Promise<void> }) {
  const chosen = DECISIONS.find((d) => d.value === t.decision);
  return (
    <Panel className="mt-3">
      <h2 className="text-lg font-normal">What did you do with it?</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DECISIONS.map(({ value, label }) => (
          <Button
            key={value}
            variant={t.decision === value ? "primary" : "secondary"}
            className="px-3!"
            aria-pressed={t.decision === value}
            onClick={async () => {
              await trials.put({ ...t, decision: value });
              await onSaved();
            }}
          >
            {t.decision === value && <Check size={18} aria-hidden="true" />}
            {label}
          </Button>
        ))}
      </div>
      {chosen && (
        <>
          <p className="mt-3" role="status">{chosen.saved}</p>
          <ButtonLink href="/passport" variant="secondary" className="mt-3 w-full">See your Skin Passport</ButtonLink>
        </>
      )}
    </Panel>
  );
}

function VerdictView({ data, reload }: { data: TrialData; reload: () => Promise<void> }) {
  const { trial: t, scans, verdict: v } = data;
  const [panel, setPanel] = useState<"return" | "gentler" | "share" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const bad = isBad(v);
  const h2h = t.mode === "head_to_head";
  const summary = buildSummary(t, scans, v);
  const classes = t.products.A.ingredientClasses ?? [];

  // Mounts once with the data in hand, so a decision's reload never replays the reveal.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero=eyebrow]", { y: 10, opacity: 0, duration: 0.4 });
        if (bad) tl.from("[data-hero=ring]", { opacity: 0, duration: 0.35 }, 0.05);
        else tl.from("[data-hero=ring]", { scale: 0.6, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, 0.2);
        tl.from("[data-hero=title]", { y: 26, opacity: 0, duration: 0.55 }, bad ? 0.1 : 0.65)
          .from("[data-hero=copy]", { y: 14, opacity: 0, duration: 0.45, stagger: 0.08 }, bad ? 0.2 : 1)
          .from("[data-rest] > *", { y: 22, opacity: 0, duration: 0.5, stagger: 0.07, clearProps: "transform,opacity" }, bad ? 0.3 : 1.25);
        if (v.verdict === "working") tl.fromTo("[data-hero=pulse]", { scale: 0.8, opacity: 0.6 }, { scale: 1.9, opacity: 0, duration: 1.2, stagger: 0.28, ease: "power2.out", immediateRender: false }, 0.7);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const close = async (status: "finished" | "stopped", decision?: Trial["decision"]) => {
    await trials.put({ ...t, status, decision: decision ?? t.decision });
    await reload();
  };

  return (
    <AppShell back={`/trial/${t.id}`} title="Verdict" action={t.isDemo ? <DemoBadge /> : undefined}>
      <div ref={root} className="mt-1">
        <VerdictHero trial={t} verdict={v} />
        <div data-rest="">
          {bad && <StopAdvice trial={t} retinoid={classes.includes("retinoid")} />}

          {!h2h && (t.status === "finished" || t.status === "stopped") && <DecisionControl trial={t} onSaved={reload} />}

          <Panel className="mt-3">
            <h2 className="text-lg font-normal">Measured on your photos</h2>
            <div className="mt-4">
              {scans.some((s) => !s.isBaseline) && !t.isDemo ? <ScanCompare scans={scans} treatedSide={t.treatedSide} /> : <SplitFace treatedSide={t.treatedSide} size={160} treatedLabel={h2h ? t.products.A.name : "Treated"} controlLabel={h2h ? t.products.B?.name ?? "B" : "Control"} />}
            </div>
            <table className="mt-5 w-full text-left text-sm">
              <caption className="sr-only">Effect per concern</caption>
              <thead className="text-ink/70">
                <tr>
                  <th className="pb-2 font-normal">Concern</th>
                  <th className="pb-2 font-normal">Treated vs expected</th>
                  <th className="pb-2 font-normal">Noise</th>
                </tr>
              </thead>
              <tbody>
                {v.concerns.map((c) => (
                  <tr key={c.concern} className="border-t border-line">
                    <td className="py-2.5">{CONCERN_LABELS[c.concern]}</td>
                    <td className={`py-2.5 ${c.verdict === "working" ? "text-good" : c.verdict === "worse" ? "text-stop" : ""}`}>{hasEffect(c) ? effectWords(c) : "—"}</td>
                    <td className="py-2.5 text-ink/70">±{noisePercent(c.sdc)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-ink/70">Scans</dt>
                <dd className="text-base">{scans.length}</dd>
              </div>
              <div>
                <dt className="text-ink/70">Adherence</dt>
                <dd className="text-base">{v.adherence === undefined ? "—" : `${Math.round(v.adherence * 100)}%`}</dd>
              </div>
              <div>
                <dt className="text-ink/70">Light balance</dt>
                <dd className="text-base">{scans.length ? `${(mean(scans.map((s) => s.meta.lightImbalance)) * 100).toFixed(1)}% avg` : "—"}</dd>
              </div>
            </dl>
            {v.reasons.length > 0 && <p className="mt-3 text-sm text-ink/70">{v.reasons.join(". ")}.</p>}
          </Panel>

          {!t.isDemo && !bad && <ClaimCheck trial={t} scans={scans} verdict={v} />}
          <ShareTools trial={t} scans={scans} verdict={v} />

          <div className="mt-4 flex flex-col gap-3">
            {t.returnDeadline && (
              <div>
                <DeadlineChip deadline={t.returnDeadline} />
              </div>
            )}
            {!v.final && (t.status === "active" || t.status === "baseline") && <ButtonLink href={`/trial/${t.id}/scan`}>Take the next scan</ButtonLink>}
            {v.verdict === "working" && t.status !== "finished" && <Button onClick={() => close("finished", h2h ? undefined : "kept")}>Keep it and close the trial</Button>}
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
                    {classes.length > 0 && <p className="text-sm text-ink/70">This product contains: {classes.map((c) => CLASS_LABELS[c]).join(", ")}.</p>}
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
              Copy a text summary
            </Button>
            {panel === "share" && <CopyBox text={draftMessage(summary, "share_summary")} label="Copy summary" />}
            {bad && t.status !== "stopped" && (
              <Button variant="secondary" className="text-stop!" onClick={() => close("stopped")}>
                Mark trial as stopped
              </Button>
            )}
            {!bad && (
              <ButtonLink href={`/trial/${t.id}/report`} variant="secondary">
                <FileText size={18} aria-hidden="true" />
                Report for your dermatologist
              </ButtonLink>
            )}
            <ButtonLink href={`/trial/${t.id}/chat`} variant="secondary">
              Ask the assistant about this result
            </ButtonLink>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function VerdictPage() {
  const { id } = useParams<{ id: string }>();
  const { data, reload } = useTrial(id);
  if (!data) return <TrialState loading={data === undefined} />;
  return <VerdictView data={data} reload={reload} />;
}
