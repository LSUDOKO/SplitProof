"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUp, ScanFace, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CopyBox } from "@/components/CopyBox";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { TrialState } from "@/components/TrialNotFound";
import { Button, DemoBadge, IconLink } from "@/components/ui";
import { draftMessage } from "@/lib/agent/drafts";
import { buildSummary, type AgentSummary } from "@/lib/agent/summary";
import type { AgentAction } from "@/lib/agent/tools";
import { downloadIcs } from "@/lib/clipboard";
import { evaluateTrial } from "@/lib/stats/verdict";
import type { Trial } from "@/lib/types";
import { useAllTrials, useTrial } from "@/lib/useTrial";

interface Msg {
  role: "user" | "assistant";
  content: string;
  actions?: AgentAction[];
  offline?: boolean;
}

const SUGGESTED: { text: string; lang?: string }[] = [
  { text: "Is it working?" },
  { text: "क्या यह काम कर रहा है?", lang: "hi" },
  { text: "Why do you compare sides?" },
  { text: "What if I missed days?" },
  { text: "Draft my return" },
];

const NO_REDUCE = "(prefers-reduced-motion: no-preference)";
const ASSISTANT_BUBBLE = "w-fit max-w-[92%] break-words rounded-[1.25rem] rounded-tl-md bg-raised p-3.5";

/** Deterministic answer when the LLM is unavailable: only engine numbers, never guesses. */
function offlineAnswer(q: string, s: AgentSummary): Msg {
  const t = q.toLowerCase();
  if (/return|refund|draft/.test(t)) return { role: "assistant", content: "Here is a return request you can copy and send.", actions: [{ kind: "draft", text: draftMessage(s, "return_request") }], offline: true };
  if (/compare|why.*side|control/.test(t))
    return {
      role: "assistant",
      content: "Light, sleep, stress, weather and time of day change both cheeks at once. Comparing the treated cheek with the control cheek in the same photo cancels those out, so what's left is the product.",
      offline: true,
    };
  if (/miss|forgot|skip/.test(t))
    return {
      role: "assistant",
      content: `Missed days weaken the effect, so the verdict becomes less confident${s.trial.adherencePct !== undefined ? ` (your adherence so far: ${s.trial.adherencePct}%)` : ""}. Just continue as planned and keep scanning on schedule.`,
      offline: true,
    };
  return { role: "assistant", content: s.verdict.sentence, offline: true };
}

/** The product floating on top of the page, the screen's only decoration. */
function ProductHero({ trial: t, days, plannedDays }: { trial: Trial; days: number; plannedDays: number }) {
  const art = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCE, () => {
      gsap.to(art.current, { y: -6, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    return () => mm.revert();
  });
  const b = t.products.B;
  return (
    <div className="pb-5 text-center">
      <div ref={art} className="flex justify-center">
        <ProductArt name={t.products.A.name} size={168} className="h-[22dvh] max-h-[168px] w-auto" />
        {b && <ProductArt name={b.name} size={168} className="-ml-6 h-[22dvh] max-h-[168px] w-auto" />}
      </div>
      <h2 className="mt-2 text-xl font-light leading-snug">{b ? `${t.products.A.name} vs ${b.name}` : t.products.A.name}</h2>
      <p className="mt-0.5 text-sm text-ink/70">
        Day {days} of {plannedDays}
      </p>
    </div>
  );
}

function TypingDots() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCE, () => {
        gsap.fromTo("[data-dot]", { y: 0, opacity: 0.35 }, { y: -5, opacity: 1, duration: 0.42, ease: "sine.inOut", stagger: { each: 0.14, repeat: -1, yoyo: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={`${ASSISTANT_BUBBLE} flex items-center gap-2.5`} role="status">
      <span className="flex items-center gap-1.5 pt-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} data-dot className="h-2 w-2 rounded-full bg-ink/60" />
        ))}
      </span>
      <span className="text-sm text-ink/70">Checking your measurements…</span>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "user")
    return (
      <Reveal y={10} className="ml-auto w-fit max-w-[85%] break-words rounded-[1.25rem] rounded-br-md bg-good-soft p-3.5">
        <p className="whitespace-pre-wrap">{m.content}</p>
      </Reveal>
    );
  return (
    <Reveal y={10} className={ASSISTANT_BUBBLE}>
      <p className="whitespace-pre-wrap">{m.content}</p>
      {m.actions?.map((a, k) =>
        a.kind === "draft" && a.text ? (
          <div key={k} className="mt-3">
            <CopyBox text={a.text} label="Copy text" />
          </div>
        ) : a.kind === "reminder" && a.dateISO ? (
          <Button key={k} variant="secondary" className="mt-3 w-full" onClick={() => downloadIcs(a.dateISO!, "SplitSide scan", a.note)}>
            Add scan to calendar
          </Button>
        ) : null,
      )}
      {m.offline && <p className="mt-2 text-xs text-ink/70">Answered from your trial data without the AI assistant.</p>}
    </Reveal>
  );
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { data } = useTrial(id);
  const { list } = useAllTrials();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!msgs.length) return; // Keep the product hero in view until the conversation starts.
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    end.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "end" });
  }, [msgs.length, busy]);
  if (!data) return <TrialState loading={data === undefined} />;
  const { trial: t, scans, verdict } = data;
  const history = (list ?? []).map((d) => ({ trial: d.trial, verdict: evaluateTrial(d.trial, d.scans).verdict }));
  const summary = buildSummary(t, scans, verdict, history);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const out = await res.json();
      setMsgs([...next, out.fallback || !out.text ? offlineAnswer(q, summary) : { role: "assistant", content: out.text, actions: out.actions }]);
    } catch {
      setMsgs([...next, offlineAnswer(q, summary)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      back={`/trial/${t.id}`}
      title="AI Help"
      action={
        t.isDemo ? (
          <DemoBadge />
        ) : t.status === "baseline" || t.status === "active" ? (
          <IconLink href={`/trial/${t.id}/scan`} label="Scan this trial">
            <ScanFace size={18} aria-hidden="true" />
          </IconLink>
        ) : undefined
      }
    >
      <ProductHero trial={t} days={verdict.days} plannedDays={verdict.plannedDays} />

      {/* Bleeds to the page edges and past main's bottom padding; pb-44 clears the fixed composer and nav. */}
      <section className="-mx-4 -mb-32 min-h-[60dvh] rounded-t-[2rem] border-t border-line bg-card px-4 pb-44 pt-5" aria-label="AI Assistant">
        <h2 className="flex items-center gap-2 text-lg font-normal">
          <Sparkles size={18} strokeWidth={1.8} aria-hidden="true" />
          AI Assistant
        </h2>
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className={ASSISTANT_BUBBLE}>
            <p>I manage your {t.products.A.name} trial. Every number I give comes from your measurements. I never see your photos, only the numbers.</p>
          </div>
          {msgs.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {busy && <TypingDots />}
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED.map((s) => (
                <button key={s.text} lang={s.lang} onClick={() => ask(s.text)} className="min-h-11 rounded-full bg-raised px-4 text-sm shadow-[var(--shadow-soft)] transition-transform active:scale-[0.97]">
                  {s.text}
                </button>
              ))}
            </div>
          )}
          {/* Stops auto-scroll above the composer instead of behind it. */}
          <div ref={end} className="scroll-mb-44" />
        </div>
      </section>

      {/* The card-coloured fade hides messages passing behind the composer and the nav gap. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md bg-linear-to-t from-card from-85% to-transparent px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
        <form
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-raised p-1.5 shadow-[var(--shadow-float)]"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input className="min-h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-base placeholder:text-ink/70" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your trial" aria-label="Message" maxLength={500} />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white transition-transform active:scale-[0.94] disabled:opacity-40">
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
