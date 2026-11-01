"use client";
import { ArrowUpRight, Leaf, Plus, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ButtonLink, DemoBadge, IconLink } from "@/components/ui";
import { VERDICT_TITLES } from "@/lib/trial/explain";
import { useAllTrials, type TrialData } from "@/lib/useTrial";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Dark-green hero pill: the trial that most needs attention, with a progress ring. */
function Hero({ d }: { d: TrialData }) {
  const { trial: t, verdict: v } = d;
  const lead = v.concerns.find((c) => c.verdict === v.verdict) ?? v.concerns[0];
  const progress = Math.min(1, v.days / Math.max(1, v.plannedDays));
  const r = 22;
  const c = 2 * Math.PI * r;
  const word = v.verdict === "working" ? "Working" : v.verdict === "stop" ? "Stop" : v.verdict === "worse" ? "Worse" : v.verdict === "no_difference" ? "Same" : "Testing";
  const pct = lead?.series?.post.length ? `${lead.effectPct > 0 ? "−" : "+"}${Math.abs(lead.effectPct)}%` : `${v.days}/${v.plannedDays}`;
  return (
    <Link href={`/trial/${t.id}`} className="mt-4 flex items-center gap-3 rounded-full bg-forest py-3 pl-5 pr-3 text-white shadow-[var(--shadow-float)]">
      <Leaf size={18} aria-hidden="true" className="shrink-0 opacity-80" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{lead ? CONCERN_LABELS[lead.concern] : "Trial"} · {t.products.A.name}</span>
        <span className="block text-xs text-white/70">
          Day {v.days} of {v.plannedDays}
          {t.isDemo ? " · demo" : ""}
        </span>
      </span>
      <span className="text-3xl font-light tabular-nums">{pct}</span>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`${Math.round(progress * 100)}% of the trial done, verdict ${word}`}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${c * progress} ${c}`} transform="rotate(-90 28 28)" />
        <text x="28" y="32" textAnchor="middle" fontSize="10" fill="white">
          {word}
        </text>
      </svg>
    </Link>
  );
}

function TrialCard({ d }: { d: TrialData }) {
  const { trial: t, verdict: v } = d;
  const tone = v.verdict === "working" ? "bg-good-soft text-good" : v.verdict === "stop" || v.verdict === "worse" ? "bg-stop-soft text-stop" : "bg-raised text-ink";
  return (
    <Link href={`/trial/${t.id}`} className="relative flex min-h-48 flex-col rounded-panel bg-card p-4 shadow-[var(--shadow-soft)]">
      <svg viewBox="0 0 40 40" className="h-14 w-14" aria-hidden="true">
        <path d="M20 4a16 16 0 0 0 0 32z" fill={t.treatedSide === "left" ? "var(--color-treated)" : "var(--color-control)"} opacity="0.85" />
        <path d="M20 4a16 16 0 0 1 0 32z" fill={t.treatedSide === "left" ? "var(--color-control)" : "var(--color-treated)"} opacity="0.85" />
      </svg>
      <span className="mt-auto block text-sm text-muted">{t.mode === "head_to_head" ? "Head-to-head" : `Day ${v.days} of ${v.plannedDays}`}</span>
      <span className="mt-0.5 line-clamp-2 pr-10 text-base leading-snug">{t.mode === "head_to_head" ? `${t.products.A.name} vs ${t.products.B?.name}` : t.products.A.name}</span>
      <span className={`mt-2 w-fit rounded-full px-2.5 py-0.5 text-xs ${tone}`}>{VERDICT_TITLES[t.status === "baseline" ? "insufficient_data" : v.verdict]}</span>
      <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
        <ArrowUpRight size={18} />
      </span>
      {t.isDemo && (
        <span className="absolute right-3 top-3">
          <DemoBadge />
        </span>
      )}
    </Link>
  );
}

export default function Trials() {
  const { list } = useAllTrials();
  const focus = list?.find((d) => d.trial.status === "active" || d.trial.status === "baseline") ?? list?.[0];
  return (
    <AppShell
      action={
        <div className="flex gap-2">
          <IconLink href="/evidence" label="Evidence board">
            <Users size={18} aria-hidden="true" />
          </IconLink>
        </div>
      }
    >
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-raised shadow-[var(--shadow-soft)]" aria-hidden="true">
          <Leaf size={20} className="text-forest" />
        </span>
        <span>
          <span className="block text-xl font-normal">Hello</span>
          <span className="block text-sm text-muted">{greeting()}</span>
        </span>
      </div>

      {focus && <Hero d={focus} />}

      <div className="mt-6 flex items-center justify-between gap-3">
        <h1 className="text-[1.7rem] font-normal tracking-tight">Your trials</h1>
        <Link href="/trial/new" className="flex items-center gap-2 rounded-full bg-forest py-1.5 pl-4 pr-1.5 text-white shadow-[var(--shadow-soft)]">
          New
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night">
            <Plus size={16} aria-hidden="true" />
          </span>
        </Link>
      </div>

      {list === undefined ? (
        <p className="mt-6 text-muted" role="status">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-5 rounded-panel bg-card p-6 text-center shadow-[var(--shadow-soft)]">
          <p className="font-medium">No trials yet.</p>
          <p className="mt-1 text-muted">Start one with a product you just bought, or explore the demo first.</p>
          <div className="mt-5 flex flex-col gap-3">
            <ButtonLink href="/consent">Start a trial</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">Explore a demo trial</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {list.map((d) => (
            <li key={d.trial.id}>
              <TrialCard d={d} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/hair" className="mt-3 flex items-center justify-between rounded-panel bg-card px-4 py-4 shadow-[var(--shadow-soft)]">
        <span>
          <span className="block">SplitHair</span>
          <span className="text-sm text-muted">Test an anti-frizz product on one side of your head</span>
        </span>
        <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-muted">Beta</span>
      </Link>
    </AppShell>
  );
}
