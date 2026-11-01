"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { FaceLineArt, ScannerFrame } from "@/components/ScannerFrame";
import { ScanSweep } from "@/components/SplitPreview";
import { ButtonLink } from "@/components/ui";
import { BASELINE_SCANS } from "@/lib/config";
import { nextScanDay } from "@/lib/trial/plan";
import { useAllTrials, type TrialData } from "@/lib/useTrial";

function LegendChip({ tint, dot, children }: { tint: string; dot: string; children: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${tint}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function OpenTrialRow({ d }: { d: TrialData }) {
  const { trial: t, scans } = d;
  const base = scans.filter((s) => s.isBaseline).length;
  const next = nextScanDay(t.plannedDays, scans.map((s) => s.dayIndex));
  return (
    <Link href={`/trial/${t.id}/scan`} className="flex items-center gap-3 rounded-panel bg-card p-3 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
      <ProductArt name={t.products.A.name} size={52} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{t.products.A.name}</span>
        <span className="text-sm text-ink/70">{base < BASELINE_SCANS ? `Baseline ${base + 1} of ${BASELINE_SCANS}` : next !== undefined ? `Next: day ${next}` : "Final scan"}</span>
      </span>
      <span className="shrink-0 rounded-full bg-forest px-4 py-2 text-sm text-white">Scan</span>
    </Link>
  );
}

/** Centre nav action: go straight to the scanner for whichever trial needs a photo. */
export default function ScanHub() {
  const { list } = useAllTrials();
  const open = (list ?? []).filter((d) => d.trial.status === "baseline" || d.trial.status === "active");
  const real = open.filter((d) => !d.trial.isDemo);
  const demo = (list ?? []).find((d) => d.trial.isDemo);
  return (
    <AppShell title="Face scanner" back="/trials">
      <ScannerFrame status="Same light, same angle, both cheeks in one photo">
        <FaceLineArt />
        <ScanSweep />
      </ScannerFrame>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
        <LegendChip tint="bg-treated-soft" dot="bg-treated">Treated cheek</LegendChip>
        <LegendChip tint="bg-control-soft" dot="bg-control">Control cheek</LegendChip>
        <span className="rounded-full bg-raised px-3 py-1">Light balance check</span>
      </div>

      {list === undefined ? (
        <p className="mt-7 text-ink/70" role="status">Loading…</p>
      ) : (
        <div className="mt-7">
          <h2 className="text-lg font-normal">{real.length ? "Ready to scan" : "No open trials"}</h2>
          {real.length > 0 && (
            <Reveal as="ul" stagger={0.08} className="mt-3 space-y-3">
              {real.map((d) => (
                <li key={d.trial.id}>
                  <OpenTrialRow d={d} />
                </li>
              ))}
            </Reveal>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {!real.length && <ButtonLink href="/trial/new">Start a trial</ButtonLink>}
            {demo && (
              <ButtonLink href={`/trial/${demo.trial.id}/scan`} variant="secondary">
                Practise the scanner (nothing is uploaded)
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
