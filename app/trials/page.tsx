"use client";
import { ArrowUpRight, Leaf, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { ThemeIconButton } from "@/components/ThemeToggle";
import { ButtonLink, DemoBadge, IconLink } from "@/components/ui";
import { VerdictBadge, VerdictPill } from "@/components/VerdictBadge";
import { settings } from "@/lib/db";
import { useAllTrials, type TrialData } from "@/lib/useTrial";

function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Greeting() {
  // Both are client-only (IndexedDB, the local clock), so they land together after mount.
  const [who, setWho] = useState<{ name?: string; part: string }>({ part: "" });
  useEffect(() => {
    settings.get<string>("userName").then((name) => setWho({ name, part: partOfDay() }));
  }, []);
  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-raised shadow-[var(--shadow-soft)]" aria-hidden="true">
        <Leaf size={20} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xl font-normal">{who.name ? `Hello, ${who.name}` : "Hello"}</span>
        <span className="block min-h-5 text-sm text-ink/70">{who.part}</span>
      </span>
    </div>
  );
}

/** Every row wraps on its own and the round button keeps its own corner, so nothing can collide at 360 px. */
function TrialCard({ d }: { d: TrialData }) {
  const { trial: t, verdict: v } = d;
  const h2h = t.mode === "head_to_head";
  return (
    <Link href={`/trial/${t.id}`} className="group flex w-full flex-col rounded-panel bg-card px-4 pb-4 shadow-[var(--shadow-soft)]">
      <span className="-mt-8 flex justify-center drop-shadow-[0_12px_12px_rgb(15_35_15/0.25)] transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true">
        <ProductArt name={t.products.A.name} size={h2h ? 88 : 104} />
        {h2h && <ProductArt name={t.products.B?.name} size={88} className="-ml-7" />}
      </span>
      <span className="mt-1 line-clamp-3 break-words text-base leading-snug">{h2h ? `${t.products.A.name} vs ${t.products.B?.name}` : t.products.A.name}</span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        <VerdictBadge compact verdict={t.status === "baseline" ? "insufficient_data" : v.verdict} />
        {t.isDemo && <DemoBadge />}
      </span>
      <span className="mt-auto flex items-end justify-between gap-2 pt-3">
        <span className="min-w-0 text-xs text-ink/70">{h2h ? "Head-to-head" : `Day ${v.days} of ${v.plannedDays}`}</span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 flex flex-col items-center rounded-panel bg-card p-6 text-center shadow-[var(--shadow-soft)]">
      <ProductArt kind="jar" size={112} />
      <p className="mt-3 text-lg">No trials yet.</p>
      <p className="mt-1 text-ink/70">Start one with a product you just bought, or explore the demo first.</p>
      <div className="mt-5 flex w-full flex-col gap-3">
        <ButtonLink href="/consent">Start a trial</ButtonLink>
        <ButtonLink href="/demo" variant="secondary">Explore a demo trial</ButtonLink>
      </div>
    </div>
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
          <ThemeIconButton />
        </div>
      }
    >
      <Greeting />

      {focus && (
        <Reveal className="mt-4">
          <VerdictPill data={focus} linked />
        </Reveal>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <h1 className="text-[1.7rem] font-normal tracking-tight">Your trials</h1>
        <Link href="/trial/new" className="flex min-h-11 items-center gap-2 rounded-full bg-forest-deep py-1.5 pl-4 pr-1.5 text-white shadow-[var(--shadow-soft)]">
          New
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night">
            <Plus size={16} aria-hidden="true" />
          </span>
        </Link>
      </div>

      {list === undefined ? (
        <p className="mt-6 text-ink/70" role="status">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <Reveal as="ul" stagger={0.07} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {list.map((d) => (
            <li key={d.trial.id} className="flex pt-8">
              <TrialCard d={d} />
            </li>
          ))}
        </Reveal>
      )}

      <Link href="/hair" className="mt-3 flex items-center justify-between gap-3 rounded-panel bg-card px-4 py-4 shadow-[var(--shadow-soft)]">
        <span className="min-w-0">
          <span className="block">SplitHair</span>
          <span className="text-sm text-ink/70">Test an anti-frizz product on one side of your head</span>
        </span>
        <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs">Beta</span>
      </Link>
    </AppShell>
  );
}
