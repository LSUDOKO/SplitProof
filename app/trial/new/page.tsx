"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SplitFace } from "@/components/SplitFace";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { events, newId, settings, trials } from "@/lib/db";
import { getProfile, preparePhoto, type SkinProfile } from "@/lib/preview/client";
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
  const [fitz, setFitz] = useState("");
  const [fitzNote, setFitzNote] = useState("");
  const [wearTest, setWearTest] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [noReturn, setNoReturn] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    settings.get<string>("consentAt").then((c) => !c && router.replace("/consent"));
    // Reuse a type measured earlier (e.g. in a Preview); the user can still change it.
    settings.get<SkinProfile & { at: string }>("skinProfile").then((p) => {
      if (p?.fitzpatrick) {
        setFitz(String(p.fitzpatrick));
        setFitzNote(`Measured from your photo on ${new Date(p.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}.`);
      }
    });
  }, [router]);

  const measureFitz = async (file?: File) => {
    if (!file) return;
    setFitzNote("Measuring from your photo…");
    try {
      const prof = await getProfile((await preparePhoto(file)).blob);
      await settings.set("skinProfile", { ...prof, at: new Date().toISOString() });
      setFitz(String(prof.fitzpatrick));
      setFitzNote(`Measured by YouCam AI: type ${prof.fitzpatrick}. You can change it.`);
    } catch (e) {
      setFitzNote(e instanceof Error ? e.message : "Couldn't measure it. Pick it yourself.");
    }
  };

  const chosen = GOALS.filter((g) => goals.includes(g.label));
  const zone: Zone = chosen.some((g) => g.zone === "under_eyes") ? "under_eyes" : "cheeks";
  const keys = [...new Set(chosen.filter((g) => g.zone === zone).flatMap((g) => g.keys))];
  // Redness always rides along: it powers the irritation sentinel.
  const goalKeys: ConcernKey[] = keys.length && !keys.includes("hd_redness") && zone === "cheeks" ? [...keys, "hd_redness"] : keys;
  const today = new Date().toISOString();
  // Duration follows the user's own goals, not the redness sentinel that rides along.
  const plan = keys.length ? checkPlan(keys, today, deadline && !noReturn ? new Date(deadline).toISOString() : undefined, wearTest ? 7 : undefined) : null;
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
      fitzpatrick: fitz ? (Number(fitz) as Trial["fitzpatrick"]) : undefined,
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
          <h1 className="text-[1.7rem] font-normal tracking-tight">What are you testing?</h1>
          <div className="grid grid-cols-2 gap-2 rounded-full border border-line p-1" role="radiogroup" aria-label="Product type">
            {[false, true].map((w) => (
              <button
                key={String(w)}
                role="radio"
                aria-checked={wearTest === w}
                onClick={() => {
                  setWearTest(w);
                  if (w) setMode("single");
                }}
                className={`min-h-10 rounded-full text-sm font-semibold ${wearTest === w ? "bg-ink text-white" : ""}`}
              >
                {w ? "Makeup wear test" : "Skincare"}
              </button>
            ))}
          </div>
          {wearTest && (
            <p className="text-sm text-muted">
              Does this foundation or concealer break you out? Wear it on one half of your face for a week; SplitSide compares breakouts, redness and oiliness with the bare half.
            </p>
          )}
          {!wearTest && (
          <div className="grid grid-cols-2 gap-2 rounded-full border border-line p-1" role="radiogroup" aria-label="Trial type">
            {(["single", "head_to_head"] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`min-h-10 rounded-full text-sm font-semibold ${mode === m ? "bg-ink text-white" : ""}`}>
                {m === "single" ? "One product" : "Product A vs B"}
              </button>
            ))}
          </div>
          )}
          {mode === "head_to_head" && <p className="text-sm text-muted">Great for a budget dupe against the premium original: one on each cheek, same photos.</p>}
          <Field label={mode === "single" ? "Product name" : "Product A"}>
            <input className={inputClass} value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder={wearTest ? "e.g. Matte foundation" : "e.g. Niacinamide serum"} />
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
          <Field label="Your skin's reaction to sun (optional)" hint="Darker skin can keep dark marks after irritation, so SplitSide warns earlier with strong actives.">
            <select className={inputClass} value={fitz} onChange={(e) => setFitz(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="1">Always burns, never tans (type I)</option>
              <option value="2">Usually burns, tans a little (type II)</option>
              <option value="3">Sometimes burns, tans evenly (type III)</option>
              <option value="4">Rarely burns, tans easily (type IV)</option>
              <option value="5">Very rarely burns, brown skin (type V)</option>
              <option value="6">Never burns, deeply pigmented skin (type VI)</option>
            </select>
          </Field>
          <label className="-mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-treated underline underline-offset-4">
            Measure it from a quick photo
            <input type="file" accept="image/jpeg,image/png" capture="user" className="sr-only" onChange={(e) => measureFitz(e.target.files?.[0])} />
          </label>
          {fitzNote && <p className="-mt-3 text-sm text-muted" role="status">{fitzNote}</p>}
          {classes.length > 0 && (
            <Panel tone="control">
              <p className="font-semibold">Strong actives found: {classes.map((c) => CLASS_LABELS[c]).join(", ")}</p>
              <p className="mt-1 text-sm">Patch-test first: try a small amount on your jaw for 24 hours.{classes.includes("retinoid") && " Check with a doctor before using retinoids if pregnant or planning pregnancy."}</p>
            </Panel>
          )}
          <Button className="w-full" disabled={!nameA.trim() || (mode === "head_to_head" && !nameB.trim())} onClick={() => {
              if (wearTest) {
                setGoals(["Acne", "Redness", "Oiliness"]);
                setStep("deadline");
              } else setStep("goals");
            }}>
            Continue
          </Button>
        </div>
      )}

      {step === "goals" && (
        <div className="mt-3 space-y-5">
          <h1 className="text-[1.7rem] font-normal tracking-tight">What should it improve?</h1>
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
          <h1 className="text-[1.7rem] font-normal tracking-tight">When can you last return it?</h1>
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
          <h1 className="text-[1.7rem] font-normal tracking-tight">{side ? (wearTest ? `Wear it on your ${side.toUpperCase()} half only.` : `Apply it to your ${side.toUpperCase()} ${zone === "under_eyes" ? "under-eye" : "cheek"} only.`) : "Let chance pick the side"}</h1>
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
