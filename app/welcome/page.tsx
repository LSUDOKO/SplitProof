"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, ChevronLeft, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/AppShell";
import { Tag, VerdictPills } from "@/components/landing/kit";
import { ScanFace } from "@/components/landing/ScanFace";
import { GlossyJar, SplitCapsule } from "@/components/landing/SplitCapsule";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { Button, Field, IconButton, inputClass } from "@/components/ui";
import { settings } from "@/lib/db";

const SLIDES: { title: string; body: string; art: ReactNode }[] = [
  {
    title: "Is it the product, or did you just sleep well?",
    body: "A new serum and a good week look the same in a selfie. That's why it's so hard to tell what's working.",
    art: (
      <SplitCapsule className="h-full">
        <span className="absolute left-[15%] top-[13%]">
          <Tag dot="treated" small>Product</Tag>
        </span>
        <span className="absolute right-[15%] top-[13%]">
          <Tag dot="control" small>Nothing</Tag>
        </span>
        <div className="absolute inset-x-[5%] top-[24%]">
          <GlossyJar />
        </div>
      </SplitCapsule>
    ),
  },
  {
    title: "Let your face be the control group.",
    body: "Product on one cheek, nothing on the other. SplitSide flips a coin to pick the side.",
    art: <ScanFace className="h-full" />,
  },
  {
    title: "One photo, a real answer.",
    body: "YouCam AI measures both sides in the same photo, so light, sleep and weather cancel out. You'll know whether to keep it, return it or stop.",
    art: (
      <SplitCapsule className="h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <VerdictPills />
        </div>
      </SplitCapsule>
    ),
  },
];
const NAME_STEP = SLIDES.length;
const THEME_STEP = NAME_STEP + 1;
const STEP_TITLES = [...SLIDES.map((s) => s.title), "What should we call you?", "Light or dark?"];

const PANEL = "flex flex-col items-center justify-center text-center [grid-area:1/1]";
const TITLE = "mt-6 text-[1.9rem] font-light leading-[1.12] tracking-[-0.02em] text-balance";
const BODY = "mt-3 max-w-[36ch] text-ink/80 text-pretty";
const SWIPE_PX = 48;

/**
 * Onboarding without a sign-in: SplitSide has no accounts because the data stays on the device.
 * All panels share one grid cell, so the transition can run the outgoing and incoming panels together.
 */
export default function Welcome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const trimmed = name.trim();

  useEffect(() => {
    settings
      .get<string>("consentAt")
      .then((consent) => (consent ? router.replace("/trials") : setReady(true)))
      .catch(() => setReady(true));
  }, [router]);

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", root.current);
        const incoming = panels[step];
        const outgoing = shown.current === step ? null : panels[shown.current];
        const dir = step >= shown.current ? 1 : -1;
        const q = gsap.utils.selector(incoming);
        const at = outgoing ? 0.16 : 0;
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        if (outgoing) tl.fromTo(outgoing, { autoAlpha: 1, x: 0 }, { autoAlpha: 0, x: -56 * dir, duration: 0.26, ease: "power2.in" }, 0);
        tl.fromTo(q("[data-art]"), { x: 80 * dir, scale: 0.94, autoAlpha: 0 }, { x: 0, scale: 1, autoAlpha: 1, duration: 0.7 }, at).fromTo(q("[data-copy]"), { x: 40 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, stagger: 0.06 }, at + 0.08);
        // The scan slide replays its line art; the verdict slide deals out its answers.
        const lines = q("[data-draw]");
        if (lines.length) {
          gsap.set(lines, { strokeDasharray: 1 });
          tl.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.012, ease: "none" }, at + 0.1)
            .fromTo(q("[data-tint]"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, at + 0.5)
            .fromTo(q("[data-side]"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.8)" }, at + 0.8);
        }
        const pills = q("[data-pill]");
        if (pills.length) tl.fromTo(pills, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.09, ease: "back.out(1.6)" }, at + 0.25);
      });
      shown.current = step;
      return () => mm.revert();
    },
    { scope: root, dependencies: [ready, step], revertOnUpdate: true },
  );

  const next = () => {
    // The name is optional, so a blocked store must not stop onboarding.
    if (step === NAME_STEP) settings.set("userName", trimmed).catch(() => undefined);
    if (step === THEME_STEP) router.push("/consent");
    else setStep(step + 1);
  };

  const swipe = (dx: number, dy: number) => {
    if (step >= NAME_STEP || Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) setStep(step + 1);
    else if (step > 0) setStep(step - 1);
  };

  return (
    <div ref={root} className="mx-auto flex min-h-dvh max-w-md flex-col overflow-x-clip px-5">
      <header className="flex h-16 shrink-0 items-center justify-between">
        {step > 0 ? (
          <IconButton label="Back" onClick={() => setStep(step - 1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </IconButton>
        ) : (
          <Logo />
        )}
        <Link href="/consent" className="inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink/80 hover:text-ink">
          Skip
        </Link>
      </header>

      {ready && (
        <>
          <main
            className="grid flex-1 touch-pan-y py-2"
            onPointerDown={(e) => {
              pointer.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => swipe(e.clientX - pointer.current.x, e.clientY - pointer.current.y)}
          >
            {SLIDES.map((s, i) => (
              <section key={s.title} data-panel className={`${PANEL} ${i === step ? "" : "invisible"}`}>
                <div data-art className="h-[clamp(7rem,calc(100svh-26.5rem),24rem)]">
                  {s.art}
                </div>
                <h1 data-copy className={TITLE}>
                  {s.title}
                </h1>
                <p data-copy className={BODY}>
                  {s.body}
                </p>
              </section>
            ))}

            <section data-panel className={`${PANEL} ${step === NAME_STEP ? "" : "invisible"}`}>
              <div data-art className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full shadow-[var(--shadow-soft)]" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 w-1/2 bg-treated-soft" />
                <span className="absolute inset-y-0 right-0 w-1/2 bg-control-soft" />
                <span className="relative text-4xl font-light">{trimmed ? Array.from(trimmed)[0].toUpperCase() : <User size={34} strokeWidth={1.5} />}</span>
              </div>
              <h1 data-copy className={TITLE}>
                What should we call you?
              </h1>
              <p data-copy className={BODY}>
                Optional. It stays on this phone and is only used to greet you.
              </p>
              <div data-copy className="mt-6 w-full text-left">
                <Field label="Your name">
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    maxLength={40}
                    autoComplete="given-name"
                    enterKeyHint="next"
                  />
                </Field>
              </div>
            </section>

            <section data-panel className={`${PANEL} ${step === THEME_STEP ? "" : "invisible"}`}>
              <div data-art className="h-[min(30svh,15rem)]" aria-hidden="true">
                <SplitCapsule className="h-full">
                  <Sun size={30} strokeWidth={1.5} className="absolute left-[22%] top-[45%]" />
                  <Moon size={30} strokeWidth={1.5} className="absolute right-[22%] top-[45%]" />
                </SplitCapsule>
              </div>
              <h1 data-copy className={TITLE}>
                {trimmed ? `Thanks, ${trimmed}. Light or dark?` : "Light or dark?"}
              </h1>
              <p data-copy className={BODY}>
                Pick what&apos;s easy on your eyes. You can change it later in Settings.
              </p>
              <div data-copy className="mt-6 w-full">
                <ThemeSegmented />
              </div>
            </section>
          </main>

          <footer className="shrink-0 pb-5 pt-3">
            <p className="sr-only" role="status">
              Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
            </p>
            <div className="flex items-center justify-between gap-3">
              {step < NAME_STEP ? (
                <div className="-ml-3.5 flex">
                  {SLIDES.map((s, i) => (
                    <button key={s.title} type="button" aria-label={`Slide ${i + 1} of ${SLIDES.length}`} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)} className="flex h-11 w-11 items-center justify-center rounded-full">
                      <span className={`h-2.5 w-2.5 rounded-full transition-transform ${i === step ? "scale-125 bg-forest" : "bg-ink/35"}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/70">
                  Step {step + 1} of {STEP_TITLES.length}
                </p>
              )}
              <Button onClick={next} className="pr-2">
                {step < NAME_STEP ? "Next" : "Continue"}
                <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-night text-white">
                  <ArrowRight size={18} aria-hidden="true" />
                </span>
              </Button>
            </div>
            <p className="mt-3 text-center text-sm text-ink/70">No account needed. Everything stays on this phone.</p>
          </footer>
        </>
      )}
    </div>
  );
}
