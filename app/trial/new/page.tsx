"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SplitFace } from "@/components/SplitFace";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { events, newId, settings, trials } from "@/lib/db";
import { CLASS_LABELS, classify, parseInci } from "@/lib/ingredients/classes";
import { checkPlan, randomSide } from "@/lib/trial/plan";
import type { ConcernKey, Side, Trial, TrialMode, Zone } from "@/lib/types";

const GOALS: { label: string; keys: ConcernKey[]; zone: Zone }[] = [
  { label: "Acne", keys: ["hd_acne"], zone: "cheeks" },
  { label: "Redness", keys: ["hd_redness"], zone: "cheeks" },
  { label: "Oiliness", keys: ["hd_oiliness"], zone: "cheeks" },
  { label: "Pores", keys: ["hd_pore"], zone: "cheeks" },
  { label: "Texture", keys: ["hd_texture"], zone: "cheeks" },
  { label: "Dark spots", keys: ["hd_age_spot"], zone: "cheeks" },
  { label: "Hydration", keys: ["hd_moisture"], zone: "cheeks" },
  { label: "Glow", keys: ["hd_radiance"], zone: "cheeks" },
  { label: "Under-eye", keys: ["hd_dark_circle", "hd_eye_bag"], zone: "under_eyes" },
];

type Step = "product" | "goals" | "deadline" | "reveal";

export default function NewTrial() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("product");
  const [mode, setMode] = useState<TrialMode>("single");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [priceA, setPriceA] = useState("");
  const [priceB, setPriceB] = useState("");
  const [inci, setInci] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [noReturn, setNoReturn] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    settings.get<string>("consentAt").then((c) => !c && router.replace("/consent"));
  }, [router]);

  const chosen = GOALS.filter((g) => goals.includes(g.label));
  const zone: Zone = chosen.some((g) => g.zone === "under_eyes") ? "under_eyes" : "cheeks";
  const keys = [...new Set(chosen.filter((g) => g.zone === zone).flatMap((g) => g.keys))];
  // Redness always rides along: it powers the irritation sentinel.
  const goalKeys: ConcernKey[] = keys.length && !keys.includes("hd_redness") && zone === "cheeks" ? [...keys, "hd_redness"] : keys;
  const today = new Date().toISOString();
  // Duration follows the user's own goals, not the redness sentinel that rides along.
  const plan = keys.length ? checkPlan(keys, today, deadline && !noReturn ? new Date(deadline).toISOString() : undefined) : null;
  const classes = classify(parseInci(inci));
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  const flip = () => {
    setFlipping(true);
    setTimeout(() => {
      setSide(randomSide());
      setFlipping(false);
    }, 1100);
  };

  const create = async () => {
    if (!side || !plan) return;
    const list = parseInci(inci);
    const t: Trial = {
      id: newId(),
      mode,
      products: {
        A: { name: nameA.trim(), price: Number(priceA) || undefined, currency: priceA ? "INR" : undefined, ingredientsInci: list, ingredientClasses: classify(list) },
        B: mode === "head_to_head" ? { name: nameB.trim(), price: Number(priceB) || undefined, currency: priceB ? "INR" : undefined } : undefined,
      },
      treatedSide: side,
      zone,
      goals: goalKeys,
      startDate: today,
      plannedDays: plan.plannedDays,
      returnDeadline: deadline && !noReturn ? new Date(deadline).toISOString() : undefined,
      status: "baseline",
      isDemo: false,
      createdAt: today,
    };
    await trials.put(t);
    await events.add({
      trialId: t.id,
      kind: "trial_created",
      text: `Side picked at random: ${mode === "head_to_head" ? `${t.products.A.name} on your ${side.toUpperCase()} cheek, ${t.products.B?.name} on the other` : `product on your ${side.toUpperCase()} cheek`}. ${plan.plannedDays}-day plan, ends ${fmt(plan.endDate)}${plan.slack !== undefined ? (plan.fitsDeadline ? `, ${plan.slack} days before your return deadline` : ", AFTER your return deadline — the verdict may come late") : ""}.`,
    });
    router.push(`/trial/${t.id}/scan`);
  };

  const stepIndex = ["product", "goals", "deadline", "reveal"].indexOf(step);

  return (
    <AppShell back="/trials" title="New trial">
      <p className="text-sm text-muted">Step {stepIndex + 1} of 4</p>

      {step === "product" && (
        <div className="mt-3 space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">What are you testing?</h1>
          <div className="grid grid-cols-2 gap-2 rounded-full border border-line p-1" role="radiogroup" aria-label="Trial type">
            {(["single", "head_to_head"] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`min-h-10 rounded-full text-sm font-semibold ${mode === m ? "bg-ink text-white" : ""}`}>
                {m === "single" ? "One product" : "Product A vs B"}
              </button>
            ))}
          </div>
          {mode === "head_to_head" && <p className="text-sm text-muted">Great for a budget dupe against the premium original: one on each cheek, same photos.</p>}
          <Field label={mode === "single" ? "Product name" : "Product A"}>
            <input className={inputClass} value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder="e.g. Niacinamide serum" />
          </Field>
          <Field label="Price (optional)">
            <input className={inputClass} inputMode="numeric" value={priceA} onChange={(e) => setPriceA(e.target.value)} placeholder="₹" />
          </Field>
          {mode === "head_to_head" && (
            <>
              <Field label="Product B">
                <input className={inputClass} value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder="e.g. Premium serum" />
              </Field>
              <Field label="Price of B (optional)">
                <input className={inputClass} inputMode="numeric" value={priceB} onChange={(e) => setPriceB(e.target.value)} placeholder="₹" />
              </Field>
            </>
          )}
          <Field label={mode === "single" ? "Ingredients (optional)" : "Ingredients of A (optional)"} hint="Paste the list from the box. It powers safety checks and your Skin Passport.">
            <textarea className={`${inputClass} min-h-24`} value={inci} onChange={(e) => setInci(e.target.value)} placeholder="Aqua, Niacinamide, Glycerin…" />
          </Field>
          {classes.length > 0 && (
            <Panel tone="control">
              <p className="font-semibold">Strong actives found: {classes.map((c) => CLASS_LABELS[c]).join(", ")}</p>
              <p className="mt-1 text-sm">Patch-test first: try a small amount on your jaw for 24 hours.{classes.includes("retinoid") && " Check with a doctor before using retinoids if pregnant or planning pregnancy."}</p>
            </Panel>
          )}
          <Button className="w-full" disabled={!nameA.trim() || (mode === "head_to_head" && !nameB.trim())} onClick={() => setStep("goals")}>
            Continue
          </Button>
        </div>
      )}

      {step === "goals" && (
        <div className="mt-3 space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">What should it improve?</h1>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const on = goals.includes(g.label);
              return (
                <button key={g.label} aria-pressed={on} onClick={() => setGoals(on ? goals.filter((x) => x !== g.label) : [...goals, g.label])} className={`min-h-11 rounded-full px-4 font-medium ${on ? "bg-ink text-white" : "border border-line bg-card"}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
          {zone === "under_eyes" && <p className="text-sm text-muted">Under-eye trial: product goes under one eye only. Other goals are skipped for this trial.</p>}
          <p className="text-sm text-muted">Redness is always measured too, so SplitSide can warn you early if the product irritates your skin.</p>
          <Button className="w-full" disabled={!goals.length} onClick={() => setStep("deadline")}>
            Continue
          </Button>
        </div>
      )}

      {step === "deadline" && plan && (
        <div className="mt-3 space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">When can you last return it?</h1>
          <Field label="Return deadline">
            <input type="date" className={inputClass} value={deadline} min={today.slice(0, 10)} disabled={noReturn} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={noReturn} onChange={(e) => setNoReturn(e.target.checked)} />
            I won&apos;t return it
          </label>
          <Panel tone={plan.fitsDeadline ? undefined : "stop"}>
            <p className="font-semibold">
              {plan.plannedDays}-day trial · ends {fmt(plan.endDate)}
              {plan.slack !== undefined && (plan.fitsDeadline ? ` · return deadline ${fmt(new Date(deadline).toISOString())} ✓` : "")}
            </p>
            <p className="mt-1 text-sm text-muted">
              {plan.fitsDeadline
                ? "Length is set by your slowest goal: hydration shows in a week, pores and texture need about four."
                : `This trial ends ${-plan.slack!} days after your return deadline. Choose faster goals, or decide early with a lower-confidence verdict.`}
            </p>
          </Panel>
          <Button className="w-full" disabled={!deadline && !noReturn} onClick={() => setStep("reveal")}>
            Continue
          </Button>
        </div>
      )}

      {step === "reveal" && (
        <div className="mt-3 space-y-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{side ? `Apply it to your ${side.toUpperCase()} ${zone === "under_eyes" ? "under-eye" : "cheek"} only.` : "Let chance pick the side"}</h1>
          {!side && <p className="text-muted">A random side stops you from choosing the cheek that already looks better.</p>}
          <div className="flex justify-center py-2" style={{ perspective: 600 }}>
            <div style={{ animation: flipping ? "coin 1.1s ease-out" : undefined, transformStyle: "preserve-3d" }}>
              <SplitFace size={190} treatedSide={side ?? undefined} treatedLabel={mode === "head_to_head" ? nameA || "A" : "Product"} controlLabel={mode === "head_to_head" ? nameB || "B" : "Nothing"} labels={!!side} highlight={zone === "under_eyes" ? "none" : "cheeks"} />
            </div>
          </div>
          {!side ? (
            <Button className="w-full" onClick={flip} disabled={flipping}>
              {flipping ? "Flipping…" : "Flip the coin"}
            </Button>
          ) : (
            <>
              <Panel className="text-left">
                <p className="font-semibold">How to apply</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  <li>Clean fingers for each side{mode === "head_to_head" ? " and each product" : ""}.</li>
                  <li>The same amount every time, about one pea.</li>
                  <li>Stop about 1 cm before the middle of your face.</li>
                  {mode === "single" && <li>Leave the other side bare, or use only what you used before.</li>}
                </ul>
              </Panel>
              <p className="text-sm text-muted">Next: three baseline scans today, before you apply anything.</p>
              <Button className="w-full" onClick={create}>
                Start baseline scans
              </Button>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
