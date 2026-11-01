"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DemoBadge, Field, Panel, inputClass } from "@/components/ui";
import { VerdictBadge } from "@/components/VerdictBadge";
import { CLASS_LABELS, classify, ingredientProfile, parseInci } from "@/lib/ingredients/classes";
import { useAllTrials } from "@/lib/useTrial";

export default function Passport() {
  const { list } = useAllTrials();
  const [paste, setPaste] = useState("");
  const done = (list ?? []).filter((d) => d.trial.status === "finished" || d.trial.status === "stopped" || d.verdict.final);
  const flags = ingredientProfile(done.map((d) => ({ trial: d.trial, verdict: d.verdict.verdict })));
  const pasted = parseInci(paste);
  const pastedClasses = classify(pasted).map((c) => CLASS_LABELS[c]);
  const hits = flags.filter((f) => pasted.includes(f.name) || pastedClasses.includes(f.name));
  const anyDemo = done.some((d) => d.trial.isDemo);

  return (
    <AppShell action={anyDemo ? <DemoBadge /> : undefined}>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">Skin Passport</h1>
      <p className="mt-1 text-muted">What your own trials say about your skin.</p>

      <Panel className="mt-5">
        <h2 className="font-semibold">Ingredient patterns</h2>
        {flags.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Patterns appear after at least two products irritate your skin. Until then, nothing to flag.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {flags.map((f) => (
              <li key={f.name}>
                <span className="font-semibold capitalize">{f.name}</span> appeared in {f.seenStop} of the {f.seenTotal} products that contained it and irritated your skin.
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">A pattern from a few trials, not proof that this ingredient is the cause.</p>
      </Panel>

      <Panel className="mt-3">
        <h2 className="font-semibold">Check a product before you buy</h2>
        <div className="mt-3">
          <Field label="Paste its ingredient list">
            <textarea className={`${inputClass} min-h-24`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Aqua, Glycerin, Parfum…" />
          </Field>
        </div>
        {paste.trim() &&
          (hits.length ? (
            <p className="mt-3 rounded-xl bg-stop-soft p-3 text-sm text-stop">Contains {hits.map((h) => h.name).join(", ")}, linked to your past irritation. Consider a patch test or a split-face trial first.</p>
          ) : (
            <p className="mt-3 rounded-xl bg-good-soft p-3 text-sm text-good">Nothing linked to your past irritation.{pastedClasses.length ? ` Strong actives: ${pastedClasses.join(", ")}.` : ""}</p>
          ))}
      </Panel>

      <h2 className="mt-6 font-semibold">Trial history</h2>
      <ul className="mt-3 space-y-2">
        {(list ?? []).map(({ trial: t, verdict: v }) => (
          <li key={t.id}>
            <Link href={`/trial/${t.id}/verdict`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3">
              <span>
                <span className="font-medium">{t.products.A.name}</span>
                <span className="block text-sm text-muted">{new Date(t.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              </span>
              <VerdictBadge verdict={v.verdict} />
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
