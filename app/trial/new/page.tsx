"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ProductArt } from "@/components/ProductArt";
import { SplitFace } from "@/components/SplitFace";
import { Button, Field, Panel, Segmented, inputClass } from "@/components/ui";
import { events, newId, settings, trials } from "@/lib/db";
import { CLASS_LABELS, classify, parseInci } from "@/lib/ingredients/classes";
import type { ProductLookup } from "@/lib/integrations/openBeautyFacts";
import { getProfile, preparePhoto, type SkinProfile } from "@/lib/preview/client";
import { checkPlan, randomSide, type PlanCheck } from "@/lib/trial/plan";
import type { ConcernKey, Side, Trial, TrialMode, Zone } from "@/lib/types";

/** Client-only: it feature-detects BarcodeDetector while rendering, which the server's HTML can't match. */
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner").then((m) => m.BarcodeScanner), { ssr: false, loading: () => <div className="h-40 rounded-panel bg-card" /> });

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
const STEP_NAMES: Record<Step, string> = { product: "Product", goals: "Goals", deadline: "Return window", reveal: "Side" };

interface Draft {
  mode: TrialMode;
  wearTest: boolean;
  nameA: string;
  nameB: string;
  priceA: string;
  priceB: string;
  inci: string;
  fitz: string;
  fitzNote: string;
  goals: string[];
  deadline: string;
  noReturn: boolean;
}
const EMPTY: Draft = { mode: "single", wearTest: false, nameA: "", nameB: "", priceA: "", priceB: "", inci: "", fitz: "", fitzNote: "", goals: [], deadline: "", noReturn: false };
type Update = (patch: Partial<Draft>) => void;

const NO_REDUCE = "(prefers-reduced-motion: no-preference)";
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * A click-started animation: runs `play` if motion is allowed, else calls `done` at once. Killing (not
 * reverting) at the end keeps the last frame on screen until React swaps the view.
 */
function playOnce(play: (done: () => void) => void, done: () => void) {
  const mm = gsap.matchMedia();
  const finish = () => {
    mm.kill();
    done();
  };
  mm.add(NO_REDUCE, () => {
    play(finish);
  });
  mm.add("(prefers-reduced-motion: reduce)", finish);
}

function StepProgress({ steps, current }: { steps: Step[]; current: number }) {
  const name = STEP_NAMES[steps[current]];
  return (
    <div role="progressbar" aria-label="New trial progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1} aria-valuetext={`Step ${current + 1} of ${steps.length}: ${name}`}>
      <p className="flex justify-between gap-3 text-sm">
        <span>Step {current + 1} of {steps.length}</span>
        <span className="text-ink/70">{name}</span>
      </p>
      <div className="mt-2 flex gap-1.5">
        {steps.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <span className={`block h-full origin-left rounded-full bg-forest transition-transform duration-500 ease-out ${i <= current ? "scale-x-100" : "scale-x-0"}`} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Stable on purpose: focus moves to each new step's title once, not on every keystroke's render. */
const focusOnMount = (el: HTMLElement | null) => el?.focus();

function StepTitle({ children }: { children: ReactNode }) {
  return (
    <h2 ref={focusOnMount} tabIndex={-1} className="min-w-0 scroll-mt-24 text-[1.7rem] font-normal leading-tight tracking-tight outline-none!">
      {children}
    </h2>
  );
}

function StepHead({ title, art }: { title: string; art: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <StepTitle>{title}</StepTitle>
      <span className="-my-3 shrink-0 drop-shadow-[0_10px_10px_rgb(15_35_15/0.25)]" aria-hidden="true">{art}</span>
    </div>
  );
}

function StepNav({ onBack, onNext, disabled, locked, children = "Continue" }: { onBack: () => void; onNext: () => void; disabled?: boolean; locked?: boolean; children?: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" className="shrink-0" disabled={locked} onClick={onBack}>Back</Button>
      <Button className="min-w-0 flex-1" disabled={disabled} onClick={onNext}>{children}</Button>
    </div>
  );
}

function ProductStep({ d, update, onNext }: { d: Draft; update: Update; onNext: () => void }) {
  const h2h = d.mode === "head_to_head";
  const classes = classify(parseInci(d.inci));

  const fromBarcode = (p: ProductLookup) =>
    update({
      ...(p.name && { nameA: p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase()) ? `${p.brand} ${p.name}` : p.name }),
      ...(p.ingredients && { inci: p.ingredients }),
    });

  const measureFitz = async (file?: File) => {
    if (!file) return;
    update({ fitzNote: "Measuring from your photo…" });
    try {
      const prof = await getProfile((await preparePhoto(file)).blob);
      await settings.set("skinProfile", { ...prof, at: new Date().toISOString() });
      update({ fitz: String(prof.fitzpatrick), fitzNote: `Measured by YouCam AI: type ${prof.fitzpatrick}. You can change it.` });
    } catch (e) {
      update({ fitzNote: e instanceof Error ? e.message : "Couldn't measure it. Pick it yourself." });
    }
  };

  return (
    <>
      <StepHead title="What are you testing?" art={<ProductArt kind="pump" size={72} />} />
      <div className="space-y-2">
        <Segmented
          label="Product type"
          value={d.wearTest ? "makeup" : "skincare"}
          options={[
            { value: "skincare", label: "Skincare" },
            { value: "makeup", label: "Makeup wear test" },
          ]}
          onChange={(v) => update(v === "makeup" ? { wearTest: true, mode: "single" } : { wearTest: false })}
        />
        {!d.wearTest && (
          <Segmented
            label="Trial type"
            value={d.mode}
            options={[
              { value: "single", label: "One product" },
              { value: "head_to_head", label: "Product A vs B" },
            ]}
            onChange={(mode) => update({ mode })}
          />
        )}
      </div>
      {d.wearTest && <p className="text-sm text-ink/70">Does this foundation or concealer break you out? Wear it on one half of your face for a week; SplitSide compares breakouts, redness and oiliness with the bare half.</p>}
      {h2h && <p className="text-sm text-ink/70">Great for a budget dupe against the premium original: one on each cheek, same photos. The barcode fills in Product A.</p>}

      <BarcodeScanner onFound={fromBarcode} />

      <Panel className="space-y-4">
        <Field label={h2h ? "Product A" : "Product name"}>
          <input className={inputClass} value={d.nameA} onChange={(e) => update({ nameA: e.target.value })} placeholder={d.wearTest ? "e.g. Matte foundation" : "e.g. Niacinamide serum"} />
        </Field>
        <Field label="Price (optional)">
          <input className={inputClass} inputMode="numeric" value={d.priceA} onChange={(e) => update({ priceA: e.target.value })} placeholder="₹" />
        </Field>
        {h2h && (
          <>
            <Field label="Product B">
              <input className={inputClass} value={d.nameB} onChange={(e) => update({ nameB: e.target.value })} placeholder="e.g. Premium serum" />
            </Field>
            <Field label="Price of B (optional)">
              <input className={inputClass} inputMode="numeric" value={d.priceB} onChange={(e) => update({ priceB: e.target.value })} placeholder="₹" />
            </Field>
          </>
        )}
        <Field label={h2h ? "Ingredients of A (optional)" : "Ingredients (optional)"}>
          <span className="mb-2 block text-sm text-ink/70">Paste the list from the box. It powers safety checks and your Skin Passport.</span>
          <textarea className={`${inputClass} min-h-24`} value={d.inci} onChange={(e) => update({ inci: e.target.value })} placeholder="Aqua, Niacinamide, Glycerin…" />
        </Field>
      </Panel>

      <Panel>
        <Field label="Your skin's reaction to sun (optional)">
          <span className="mb-2 block text-sm text-ink/70">Darker skin can keep dark marks after irritation, so SplitSide warns earlier with strong actives.</span>
          <select className={inputClass} value={d.fitz} onChange={(e) => update({ fitz: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="1">Always burns, never tans (type I)</option>
            <option value="2">Usually burns, tans a little (type II)</option>
            <option value="3">Sometimes burns, tans evenly (type III)</option>
            <option value="4">Rarely burns, tans easily (type IV)</option>
            <option value="5">Very rarely burns, brown skin (type V)</option>
            <option value="6">Never burns, deeply pigmented skin (type VI)</option>
          </select>
        </Field>
        <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-raised px-4 text-sm shadow-[var(--shadow-soft)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-forest">
          Measure it from a quick photo
          <input type="file" accept="image/jpeg,image/png" capture="user" className="sr-only" onChange={(e) => measureFitz(e.target.files?.[0])} />
        </label>
        {d.fitzNote && <p className="mt-2 text-sm text-ink/70" role="status">{d.fitzNote}</p>}
      </Panel>

      {classes.length > 0 && (
        <Panel tone="control">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert size={18} className="shrink-0 text-control" aria-hidden="true" />
            Strong actives found: {classes.map((c) => CLASS_LABELS[c]).join(", ")}
          </p>
          <p className="mt-1 text-sm">Patch-test first: try a small amount on your jaw for 24 hours.{classes.includes("retinoid") && " Check with a doctor before using retinoids if pregnant or planning pregnancy."}</p>
        </Panel>
      )}

      <Button className="w-full" disabled={!d.nameA.trim() || (h2h && !d.nameB.trim())} onClick={onNext}>
        Continue
      </Button>
    </>
  );
}

function GoalsStep({ d, update, zone, onBack, onNext }: { d: Draft; update: Update; zone: Zone; onBack: () => void; onNext: () => void }) {
  return (
    <>
      <StepHead title="What should it improve?" art={<ProductArt name={d.nameA} size={72} />} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Goals">
        {GOALS.map((g) => {
          const on = d.goals.includes(g.label);
          return (
            <button
              key={g.label}
              type="button"
              aria-pressed={on}
              onClick={() => update({ goals: on ? d.goals.filter((x) => x !== g.label) : [...d.goals, g.label] })}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 transition-colors ${on ? "bg-forest text-white" : "bg-card text-ink shadow-[var(--shadow-soft)]"}`}
            >
              {on && <Check size={16} aria-hidden="true" />}
              {g.label}
            </button>
          );
        })}
      </div>
      {zone === "under_eyes" && <p className="text-sm text-ink/70">Under-eye trial: product goes under one eye only. Other goals are skipped for this trial.</p>}
      <p className="text-sm text-ink/70">Redness is always measured too, so SplitSide can warn you early if the product irritates your skin.</p>
      <StepNav onBack={onBack} onNext={onNext} disabled={!d.goals.length} />
    </>
  );
}

function DeadlineStep({ d, update, plan, today, onBack, onNext }: { d: Draft; update: Update; plan: PlanCheck; today: string; onBack: () => void; onNext: () => void }) {
  return (
    <>
      <StepHead title="When can you last return it?" art={<ProductArt name={d.nameA} size={72} />} />
      <Panel className="space-y-3">
        <Field label="Return deadline">
          <input type="date" className={inputClass} value={d.deadline} min={today.slice(0, 10)} disabled={d.noReturn} onChange={(e) => update({ deadline: e.target.value })} />
        </Field>
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-forest" checked={d.noReturn} onChange={(e) => update({ noReturn: e.target.checked })} />
          I won&apos;t return it
        </label>
      </Panel>
      <Panel tone={plan.fitsDeadline ? undefined : "stop"}>
        <p className="text-lg">
          {plan.plannedDays}-day trial · ends {fmt(plan.endDate)}
          {plan.slack !== undefined && (plan.fitsDeadline ? ` · return deadline ${fmt(new Date(d.deadline).toISOString())} ✓` : "")}
        </p>
        <p className="mt-1 text-sm text-ink/70">
          {plan.fitsDeadline
            ? "Length is set by your slowest goal: hydration shows in a week, pores and texture need about four."
            : `This trial ends ${-plan.slack!} days after your return deadline. Choose faster goals, or decide early with a lower-confidence verdict.`}
        </p>
      </Panel>
      <StepNav onBack={onBack} onNext={onNext} disabled={!d.deadline && !d.noReturn} />
    </>
  );
}

function CoinFace({ word, noun, back = false }: { word: string; noun: string; back?: boolean }) {
  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center rounded-full border-4 border-white/30 bg-[radial-gradient(circle_at_35%_30%,var(--color-forest),var(--color-forest-deep))] text-white [backface-visibility:hidden]"
      style={{ transform: `${back ? "rotateX(180deg) " : ""}translateZ(4px)` }}
    >
      <span className="text-3xl font-light">{word}</span>
      <span className="text-sm">{noun}</span>
    </span>
  );
}

/** Solid two-sided coin: a short stack of discs gives it a rim when it turns edge-on. */
function Coin({ noun }: { noun: string }) {
  return (
    <div data-coin-wrap="" className="flex flex-col items-center" style={{ perspective: 900 }} aria-hidden="true">
      <div data-coin="" className="relative z-10 h-36 w-36 [transform-style:preserve-3d]">
        {[-3, -1, 1, 3].map((z) => (
          <span key={z} className="absolute inset-0 rounded-full bg-forest-deep" style={{ transform: `translateZ(${z}px)` }} />
        ))}
        <CoinFace word="Left" noun={noun} />
        <CoinFace word="Right" noun={noun} back />
      </div>
      <span data-coin-shadow="" className="mt-3 h-3 w-28 rounded-full bg-night/30 blur-[6px]" />
    </div>
  );
}

function SideStep({ d, zone, side, onSide, onBack, onStart, starting }: { d: Draft; zone: Zone; side: Side | null; onSide: (s: Side) => void; onBack: () => void; onStart: () => void; starting: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [flipping, setFlipping] = useState(false);
  const h2h = d.mode === "head_to_head";
  const where = zone === "under_eyes" ? "under-eye" : "cheek";
  const picked = side?.toUpperCase();
  const title = !side ? "Let chance pick the side" : d.wearTest ? `Wear it on your ${picked} half only.` : h2h ? `${d.nameA} goes on your ${picked} ${where}, ${d.nameB} on the other.` : `Apply it to your ${picked} ${where} only.`;

  // The SplitFace reveal, once the coin has landed (`side` is only set after that).
  const { contextSafe } = useGSAP(
    () => {
      if (!side) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCE, () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-face]", { scale: 0.6, y: 24, opacity: 0, duration: 0.7, ease: "back.out(1.6)" })
          .from("h2", { y: 18, opacity: 0, duration: 0.5 }, 0)
          .from("[data-cheek=treated]", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.2)" }, 0.4)
          .from("[data-after]", { y: 14, opacity: 0, duration: 0.45, stagger: 0.08, clearProps: "transform,opacity" }, 0.5);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [side], revertOnUpdate: true },
  );

  const flip = contextSafe(() => {
    const result = randomSide();
    setFlipping(true);
    playOnce(
      (done) => {
        gsap
          .timeline({ onComplete: done })
          .to("[data-coin]", { y: 12, scale: 0.94, duration: 0.16, ease: "power2.inOut" })
          .addLabel("toss")
          .to("[data-coin]", { y: -150, scale: 1.08, duration: 0.6, ease: "power2.out" }, "toss")
          .to("[data-coin]", { y: 0, scale: 1, duration: 0.55, ease: "power2.in" }, "toss+=0.6")
          .to("[data-coin]", { rotationX: (result === "left" ? 5 : 5.5) * 360, duration: 1.15, ease: "power1.out" }, "toss")
          .to("[data-coin-shadow]", { scale: 0.45, opacity: 0.35, duration: 0.6, ease: "power2.out" }, "toss")
          .to("[data-coin-shadow]", { scale: 1, opacity: 1, duration: 0.55, ease: "power2.in" }, "toss+=0.6")
          .call(() => navigator.vibrate?.(25))
          .to("[data-coin]", { y: -20, duration: 0.14, ease: "power2.out" })
          .to("[data-coin]", { y: 0, duration: 0.28, ease: "bounce.out" })
          // Fades the wrapper: opacity on the coin itself would flatten its 3D and mirror the landed face.
          .to("[data-coin-wrap]", { scale: 0.5, opacity: 0, duration: 0.25, ease: "power2.in" }, "+=0.45");
      },
      () => onSide(result),
    );
  });

  return (
    <div ref={root} className="space-y-5 text-center">
      <StepTitle key={side ?? "pick"}>{title}</StepTitle>
      {!side && <p className="text-ink/70">A random side stops you from choosing the cheek that already looks better.</p>}
      <div className="flex min-h-[19rem] items-end justify-center">
        {side ? (
          <div data-face="">
            <SplitFace size={190} treatedSide={side} treatedLabel={h2h ? d.nameA || "A" : "Product"} controlLabel={h2h ? d.nameB || "B" : "Nothing"} highlight={zone === "under_eyes" ? "under_eyes" : "cheeks"} />
          </div>
        ) : (
          <Coin noun={d.wearTest ? "half" : where} />
        )}
      </div>
      {side ? (
        <>
          <div data-after="">
            <Panel className="text-left">
              <p className="text-lg">How to apply</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Clean fingers for each side{h2h ? " and each product" : ""}.</li>
                <li>The same amount every time, about one pea.</li>
                <li>Stop about 1 cm before the middle of your face.</li>
                {!h2h && <li>Leave the other side bare, or use only what you used before.</li>}
              </ul>
            </Panel>
          </div>
          <p data-after="" className="text-sm text-ink/70">Next: three baseline scans today, before you apply anything.</p>
          <div data-after="">
            <StepNav onBack={onBack} onNext={onStart} disabled={starting}>Start baseline scans</StepNav>
          </div>
        </>
      ) : (
        <StepNav onBack={onBack} onNext={flip} disabled={flipping} locked={flipping}>
          {flipping ? "Flipping…" : "Flip the coin"}
        </StepNav>
      )}
    </div>
  );
}

export default function NewTrial() {
  const router = useRouter();
  const [{ step, direction }, setNav] = useState<{ step: Step; direction: number }>({ step: "product", direction: 0 });
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [side, setSide] = useState<Side | null>(null);
  const [starting, setStarting] = useState(false);
  const update: Update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    settings.get<string>("consentAt").then((c) => !c && router.replace("/consent"));
    // Reuse a type measured earlier (e.g. in a Preview); the user can still change it.
    settings.get<SkinProfile & { at: string }>("skinProfile").then((p) => {
      if (p?.fitzpatrick) setDraft((d) => ({ ...d, fitz: String(p.fitzpatrick), fitzNote: `Measured from your photo on ${fmt(p.at)}.` }));
    });
  }, [router]);

  const chosen = GOALS.filter((g) => draft.goals.includes(g.label));
  const zone: Zone = chosen.some((g) => g.zone === "under_eyes") ? "under_eyes" : "cheeks";
  const keys = [...new Set(chosen.filter((g) => g.zone === zone).flatMap((g) => g.keys))];
  // Redness always rides along: it powers the irritation sentinel.
  const goalKeys: ConcernKey[] = keys.length && !keys.includes("hd_redness") && zone === "cheeks" ? [...keys, "hd_redness"] : keys;
  const today = new Date().toISOString();
  const returnBy = draft.deadline && !draft.noReturn ? new Date(draft.deadline).toISOString() : undefined;
  // Duration follows the user's own goals, not the redness sentinel that rides along.
  const plan = keys.length ? checkPlan(keys, today, returnBy, draft.wearTest ? 7 : undefined) : null;

  // The wear test skips the goals step, in both directions.
  const steps: Step[] = draft.wearTest ? ["product", "deadline", "reveal"] : ["product", "goals", "deadline", "reveal"];
  const current = steps.indexOf(step);

  // Each new step slides in from the side it was asked for. The first paint (direction 0) is AppShell's.
  const { contextSafe } = useGSAP(
    () => {
      if (!direction) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCE, () => {
        // Opacity, not autoAlpha: the step title has just taken focus and must stay focusable.
        gsap.fromTo("[data-pane] > *", { x: 28 * direction, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity" });
      });
      return () => mm.revert();
    },
    { dependencies: [step], revertOnUpdate: true },
  );

  const go = contextSafe((next: Step) => {
    const heading = steps.indexOf(next) > current ? 1 : -1;
    playOnce(
      (done) => {
        gsap.to("[data-pane]", { x: -20 * heading, opacity: 0, duration: 0.16, ease: "power2.in", onComplete: done });
      },
      () => setNav({ step: next, direction: heading }),
    );
  });
  const back = () => go(steps[current - 1]);
  const forward = () => go(steps[current + 1]);

  const leaveProduct = () => {
    if (draft.wearTest) update({ goals: ["Acne", "Redness", "Oiliness"] });
    forward();
  };

  const create = async () => {
    if (!side || !plan) return;
    setStarting(true);
    const { mode, nameA, nameB, priceA, priceB, fitz } = draft;
    const list = parseInci(draft.inci);
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
      returnDeadline: returnBy,
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

  return (
    <AppShell back="/trials" title="New trial">
      <StepProgress steps={steps} current={current} />
      {/* Bleeds to the column edge so sliding panes can't add a horizontal scrollbar or clip their shadows. */}
      <div className="-mx-4 overflow-x-clip px-4">
        <div data-pane="" key={step} className="mt-5 space-y-5">
          {step === "product" && <ProductStep d={draft} update={update} onNext={leaveProduct} />}
          {step === "goals" && <GoalsStep d={draft} update={update} zone={zone} onBack={back} onNext={forward} />}
          {step === "deadline" && plan && <DeadlineStep d={draft} update={update} plan={plan} today={today} onBack={back} onNext={forward} />}
          {step === "reveal" && <SideStep d={draft} zone={zone} side={side} onSide={setSide} onBack={back} onStart={create} starting={starting} />}
        </div>
      </div>
    </AppShell>
  );
}
