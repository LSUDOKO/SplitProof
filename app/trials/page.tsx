"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DeadlineChip } from "@/components/DeadlineChip";
import { ButtonLink, DemoBadge } from "@/components/ui";
import { VerdictBadge } from "@/components/VerdictBadge";
import { useAllTrials } from "@/lib/useTrial";

export default function Trials() {
  const { list } = useAllTrials();
  return (
    <AppShell action={<Link href="/trial/new" className="text-sm font-semibold text-treated">New trial</Link>}>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Your trials</h1>
      <Link href="/hair" className="mt-3 flex items-center justify-between rounded-panel border border-line bg-card px-4 py-3 text-sm hover:border-ink/30">
        <span>
          <span className="font-semibold">SplitHair</span> · test an anti-frizz product on one side of your head
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-muted">Beta</span>
      </Link>
      {list === undefined ? (
        <p className="mt-6 text-muted" role="status">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-panel border border-dashed border-line p-6 text-center">
          <p className="font-medium">No trials yet.</p>
          <p className="mt-1 text-muted">Start one with a product you just bought, or explore the demo first.</p>
          <div className="mt-5 flex flex-col gap-3">
            <ButtonLink href="/consent">Start a trial</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">Explore a demo trial</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map(({ trial: t, verdict: v }) => (
            <li key={t.id}>
              <Link href={`/trial/${t.id}`} className="block rounded-panel border border-line bg-card p-4 hover:border-ink/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t.mode === "head_to_head" ? `${t.products.A.name} vs ${t.products.B?.name}` : t.products.A.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      Day {v.days} of {v.plannedDays} · product on your {t.treatedSide} cheek
                    </p>
                  </div>
                  {t.isDemo && <DemoBadge />}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <VerdictBadge verdict={t.status === "baseline" ? "insufficient_data" : v.verdict} />
                  {t.status !== "finished" && t.status !== "stopped" && <DeadlineChip deadline={t.returnDeadline} />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
