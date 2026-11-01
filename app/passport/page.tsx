"use client";
import { ArrowUpRight, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CountUp } from "@/components/motion";
import { DemoBadge, Field, Panel, inputClass } from "@/components/ui";
import { VerdictBadge } from "@/components/VerdictBadge";
import { CLASS_LABELS, classify, ingredientProfile, parseInci } from "@/lib/ingredients/classes";
import { moneySaved } from "@/lib/trial/savings";
import type { Trial, Verdict } from "@/lib/types";
import { useAllTrials } from "@/lib/useTrial";

function SavingLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/20 py-2">
      <dt>{label}</dt>
      <dd className="tabular-nums">₹{value.toLocaleString()}</dd>
    </div>
  );
}

function MoneyHero({ items, demo }: { items: { trial: Trial; verdict: Verdict }[]; demo: boolean }) {
  const s = moneySaved(items);
  return (
    <section className="mt-4 rounded-[2rem] bg-forest-deep p-5 text-white shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-normal">
          <Wallet size={18} strokeWidth={1.8} aria-hidden="true" />
          Money saved
        </h2>
        {demo && <span className="rounded-full border border-dashed border-white/60 px-2.5 py-0.5 text-xs">Demo data</span>}
      </div>
      {s.total === 0 && s.atStake === 0 ? (
        <p className="mt-3">Nothing to count yet. Add a price when you start a trial, and every return or cheaper choice lands here.</p>
      ) : (
        <>
          <p className="mt-2 text-5xl font-light tracking-tight tabular-nums">
            <CountUp value={s.total} prefix="₹" />
          </p>
          <dl className="mt-4 text-sm">
            <SavingLine label="Returned" value={s.returned} />
            <SavingLine label="Cheaper choice" value={s.cheaperChoice} />
            <SavingLine label="Still to decide" value={s.atStake} />
          </dl>
          <p className="mt-2 text-xs text-white/80">Uses the prices you typed. &ldquo;Still to decide&rdquo; isn&apos;t in the total until you return the product.</p>
        </>
      )}
    </section>
  );
}

export default function Passport() {
  const { list } = useAllTrials();
  const [paste, setPaste] = useState("");
  const done = (list ?? []).filter((d) => d.trial.status === "finished" || d.trial.status === "stopped" || d.verdict.final);
  const finished = done.map((d) => ({ trial: d.trial, verdict: d.verdict.verdict }));
  const flags = ingredientProfile(finished);
  const pasted = parseInci(paste);
  const pastedClasses = classify(pasted).map((c) => CLASS_LABELS[c]);
  const hits = flags.filter((f) => pasted.includes(f.name) || pastedClasses.includes(f.name));
  const anyDemo = (list ?? []).some((d) => d.trial.isDemo);

  return (
    <AppShell action={anyDemo ? <DemoBadge /> : undefined}>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">Skin Passport</h1>
      <p className="mt-1 text-ink/70">What your own trials say about your skin.</p>

      {list === undefined ? (
        <div className="mt-4 h-40 rounded-[2rem] bg-forest-deep/30 motion-safe:[animation:breathe_1.4s_ease-in-out_infinite]" role="status" aria-label="Loading your trials" />
      ) : (
        <MoneyHero items={finished} demo={done.some((d) => d.trial.isDemo)} />
      )}

      <Panel className="mt-3">
        <h2 className="text-lg font-normal">Ingredient patterns</h2>
        {flags.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70">Patterns appear after at least two products irritate your skin. Until then, nothing to flag.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {flags.map((f) => (
              <li key={f.name} className="flex items-baseline gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-stop" aria-hidden="true" />
                <span>
                  <span className="font-medium capitalize">{f.name}</span> appeared in {f.seenStop} of the {f.seenTotal} products that contained it and irritated your skin.
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink/70">A pattern from a few trials, not proof that this ingredient is the cause.</p>
      </Panel>

      <Panel className="mt-3">
        <h2 className="text-lg font-normal">Check a product before you buy</h2>
        <div className="mt-3">
          <Field label="Paste its ingredient list">
            <textarea className={`${inputClass} min-h-24 placeholder:text-ink/70!`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Aqua, Glycerin, Parfum…" />
          </Field>
        </div>
        {paste.trim() &&
          (hits.length ? (
            <p className="mt-3 rounded-2xl bg-stop-soft p-3 text-sm text-stop">Contains {hits.map((h) => h.name).join(", ")}, linked to your past irritation. Consider a patch test or a split-face trial first.</p>
          ) : (
            <p className="mt-3 rounded-2xl bg-good-soft p-3 text-sm">Nothing linked to your past irritation.{pastedClasses.length ? ` Strong actives: ${pastedClasses.join(", ")}.` : ""}</p>
          ))}
      </Panel>

      <h2 className="mt-6 text-lg font-normal">Trial history</h2>
      <ul className="mt-3 space-y-2">
        {(list ?? []).map(({ trial: t, verdict: v }) => (
          <li key={t.id}>
            <Link href={`/trial/${t.id}/verdict`} className="block rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">{t.products.A.name}</span>
                {t.isDemo && <DemoBadge />}
              </span>
              <span className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-ink/70">{new Date(t.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                <VerdictBadge verdict={v.verdict} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/evidence" className="mt-3 flex items-center gap-3 rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised" aria-hidden="true">
          <Users size={18} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            Evidence board
            <DemoBadge />
          </span>
          <span className="mt-0.5 block text-sm text-ink/70">Anonymous split-face results, pooled per product.</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
    </AppShell>
  );
}
