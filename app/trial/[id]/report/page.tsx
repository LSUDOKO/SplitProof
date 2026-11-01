"use client";
import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { contextNote } from "@/components/CheckIn";
import { SideChip } from "@/components/SplitFace";
import { TrialState } from "@/components/TrialNotFound";
import { Button, DemoBadge, Panel } from "@/components/ui";
import { effectWords, hasEffect, noisePercent } from "@/components/VerdictBadge";
import { BASELINE_SCANS } from "@/lib/config";
import { CLASS_LABELS } from "@/lib/ingredients/classes";
import { mean } from "@/lib/stats/series";
import { VERDICT_TITLES, controlSide, explainVerdict } from "@/lib/trial/explain";
import { addDays } from "@/lib/trial/plan";
import type { Product, Scan, Trial, Zone } from "@/lib/types";
import { useTrial } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

/** AppShell caps its column for phones; paper gets the whole sheet. No ">" here: this is raw CSS text. */
const PRINT_SHEET = "@media print { div:has(main) { max-width: none; } @page { margin: 14mm; } }";
/** Tokens re-pointed to dark-on-paper so the dark theme prints readably (backgrounds don't print). */
const PRINT_TOKENS = "print:[--color-ink:#000] print:[--color-muted:#333] print:[--color-card:#fff] print:[--color-raised:#fff] print:[--color-line:#bbb] print:[--color-good:#1f5a1f] print:[--color-stop:#8f2a1c] print:[--color-treated:#1d4f94] print:[--color-control:#7d4c0b] print:text-xs";

const AREA: Record<Zone, string> = { cheeks: "cheek", under_eyes: "under-eye area", forehead: "side of the forehead" };
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="mt-3 print:mt-2 print:rounded-lg print:p-3">
      <h2 className="text-lg font-normal print:text-sm print:font-medium">{title}</h2>
      <div className="mt-2 print:mt-1">{children}</div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t border-line py-1.5 first:border-t-0 print:py-0.5">
      <dt className="text-ink/70">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function ProductRows({ label, product }: { label: string; product: Product }) {
  const flagged = product.ingredientClasses ?? [];
  return (
    <>
      <Row label={label}>{product.name}</Row>
      <Row label="Ingredients">{product.ingredientsInci?.length ? product.ingredientsInci.join(", ") : "Not recorded"}</Row>
      {flagged.length > 0 && <Row label="Strong actives">{flagged.map((c) => CLASS_LABELS[c]).join(", ")}</Row>}
    </>
  );
}

function symptomsLine(scans: Scan[]) {
  if (!scans.some((s) => s.symptoms !== undefined)) return "No check-in answers recorded";
  const days = scans.filter((s) => s.symptoms).map((s) => s.dayIndex);
  return days.length ? `Burning, stinging, itching or swelling reported on day ${days.join(", ")}` : "None reported at check-ins";
}

function method(t: Trial) {
  const area = AREA[t.zone];
  const applied = t.mode === "head_to_head" ? `One product went on each ${area}, with the sides picked at random` : `The product went on one ${area}, picked at random, and the other side stayed as the control`;
  return `${applied}. YouCam AI measured the detected area of each skin feature on both sides of the same photo, and each effect below is the change in treated versus control compared with ${BASELINE_SCANS} baseline scans taken before the first application.`;
}

export default function TrialReport() {
  const { id } = useParams<{ id: string }>();
  const { data } = useTrial(id);
  if (!data) return <TrialState loading={data === undefined} />;
  const { trial: t, scans, verdict: v } = data;
  const h2h = t.mode === "head_to_head";
  const other = controlSide(t.treatedSide);
  const followUps = scans.filter((s) => !s.isBaseline);
  const lastScan = scans.at(-1);
  const notes = scans.flatMap((s) => {
    const note = s.context ? contextNote(s.context) : "";
    return note ? [{ id: s.id, day: s.dayIndex, note }] : [];
  });

  return (
    <>
      <style>{PRINT_SHEET}</style>
      <AppShell back={`/trial/${t.id}`} title="Report">
        <Button data-noprint className="mt-1 w-full" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" />
          Print or save as PDF
        </Button>

        <article className={`mt-3 print:mt-0 ${PRINT_TOKENS}`}>
          <header className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <h2 className="text-[1.7rem] font-normal leading-tight tracking-tight print:text-lg">SplitSide trial report</h2>
              <p className="text-sm text-ink/70 print:text-xs">For a dermatologist or pharmacist · printed {fmt(new Date().toISOString())}</p>
            </div>
            {t.isDemo && <DemoBadge />}
          </header>
          {t.isDemo && <p className="mt-2 px-1 text-sm print:text-xs">Demo data: a seeded example, not a real measurement.</p>}

          <Section title="Product">
            <dl className="text-sm print:text-xs">
              <ProductRows label={h2h ? "Product A" : "Product"} product={t.products.A} />
              {t.products.B && <ProductRows label="Product B" product={t.products.B} />}
              {t.fitzpatrick && <Row label="Skin type">Fitzpatrick type {t.fitzpatrick}</Row>}
            </dl>
          </Section>

          <Section title="Method">
            <p className="text-sm print:text-xs">{method(t)}</p>
          </Section>

          <Section title="Dates and sides">
            <dl className="text-sm print:text-xs">
              <Row label="Started">{fmt(t.startDate)}</Row>
              <Row label="Planned end">{fmt(addDays(t.startDate, v.plannedDays))} (day {v.plannedDays})</Row>
              <Row label="Latest scan">{lastScan ? `${fmt(lastScan.takenAt)} (day ${lastScan.dayIndex})` : "No scans yet"}</Row>
              <Row label="Scans">{scans.length - followUps.length} baseline, {followUps.length} follow-up</Row>
              <Row label="Sides">
                <span className="flex flex-wrap gap-1.5">
                  <SideChip kind="treated">{h2h ? t.products.A.name : "Treated"}: {t.treatedSide}</SideChip>
                  <SideChip kind="control">{h2h ? t.products.B?.name : "Control"}: {other}</SideChip>
                </span>
                <span className="mt-1 block text-ink/70">Left and right are the person&apos;s own.</span>
              </Row>
            </dl>
          </Section>

          <Section title="Results per concern">
            <p className="text-sm print:text-xs">
              Overall: {VERDICT_TITLES[v.verdict]}. {explainVerdict(t, v, false)}
            </p>
            <div className="-mx-2 mt-3 overflow-x-auto print:mx-0 print:mt-1 print:overflow-visible">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Effect, noise range, verdict and confidence for each concern</caption>
                <thead className="text-ink/70">
                  <tr>
                    <th className="pb-1.5 pr-1.5 align-bottom font-normal">Concern</th>
                    <th className="pb-1.5 pr-1.5 align-bottom font-normal">Effect</th>
                    <th className="pb-1.5 pr-1.5 align-bottom font-normal">Noise range</th>
                    <th className="pb-1.5 pr-1.5 align-bottom font-normal">Verdict</th>
                    <th className="pb-1.5 align-bottom font-normal">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {v.concerns.map((c) => (
                    <tr key={c.concern} className="border-t border-line align-top">
                      <td className="py-1.5 pr-1.5">{CONCERN_LABELS[c.concern]}</td>
                      <td className="py-1.5 pr-1.5">{hasEffect(c) ? effectWords(c) : "—"}</td>
                      <td className="py-1.5 pr-1.5">±{noisePercent(c.sdc)}%</td>
                      <td className="py-1.5 pr-1.5">{VERDICT_TITLES[c.verdict]}</td>
                      <td className="py-1.5">{hasEffect(c) ? c.confidence : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink/70">Effect is the detected area on the treated side against what its baseline predicts, relative to the control side. Changes inside the noise range cannot be told apart from normal variation between scans.</p>
            {v.reasons.length > 0 && <p className="mt-2 text-sm print:text-xs">{v.reasons.join(". ")}.</p>}
          </Section>

          <Section title="Quality and symptoms">
            <dl className="text-sm print:text-xs">
              <Row label="Adherence">{v.adherence === undefined ? "Not recorded" : `${Math.round(v.adherence * 100)}% of planned days, self-reported`}</Row>
              <Row label="Light balance">{scans.length ? `${(mean(scans.map((s) => s.meta.lightImbalance)) * 100).toFixed(1)}% average difference in brightness between the two sides` : "No scans yet"}</Row>
              <Row label="Symptoms">{symptomsLine(followUps)}</Row>
            </dl>
          </Section>

          <Section title="Context notes">
            {notes.length ? (
              <ul className="space-y-0.5 text-sm print:text-xs">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="text-ink/70">Day {n.day}:</span> {n.note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm print:text-xs">None logged.</p>
            )}
          </Section>

          <p className="mt-3 px-1 text-sm print:mt-2 print:text-xs">This is a cosmetic measurement on photos, not a medical assessment.</p>
        </article>
      </AppShell>
    </>
  );
}
