"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { FaceLineArt, ScannerFrame } from "@/components/ScannerFrame";
import { ButtonLink } from "@/components/ui";
import { BASELINE_SCANS } from "@/lib/config";
import { nextScanDay } from "@/lib/trial/plan";
import { useAllTrials } from "@/lib/useTrial";

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
      </ScannerFrame>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
        <span className="rounded-full bg-treated-soft px-3 py-1 text-treated">Treated cheek</span>
        <span className="rounded-full bg-control-soft px-3 py-1 text-control">Control cheek</span>
        <span className="rounded-full bg-raised px-3 py-1">Light balance check</span>
      </div>

      <h2 className="mt-7 text-lg font-normal">{real.length ? "Ready to scan" : "No open trials"}</h2>
      <ul className="mt-3 space-y-3">
        {real.map(({ trial: t, scans }) => {
          const base = scans.filter((s) => s.isBaseline).length;
          const next = nextScanDay(t.plannedDays, scans.map((s) => s.dayIndex));
          return (
            <li key={t.id}>
              <Link href={`/trial/${t.id}/scan`} className="flex items-center justify-between gap-3 rounded-panel bg-card p-4 shadow-[var(--shadow-soft)]">
                <span>
                  <span className="block font-medium">{t.products.A.name}</span>
                  <span className="text-sm text-muted">{base < BASELINE_SCANS ? `Baseline ${base + 1} of ${BASELINE_SCANS}` : next !== undefined ? `Next: day ${next}` : "Final scan"}</span>
                </span>
                <span className="rounded-full bg-forest px-4 py-2 text-sm text-white">Scan</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-col gap-3">
        {!real.length && <ButtonLink href="/consent">Start a trial</ButtonLink>}
        {demo && (
          <ButtonLink href={`/trial/${demo.trial.id}/scan`} variant="secondary">
            Practise the scanner (nothing is uploaded)
          </ButtonLink>
        )}
      </div>
    </AppShell>
  );
}
