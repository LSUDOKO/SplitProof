"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CopyBox } from "@/components/CopyBox";
import { TrialState } from "@/components/TrialNotFound";
import { Button, DemoBadge, inputClass } from "@/components/ui";
import { draftMessage } from "@/lib/agent/drafts";
import { buildSummary, type AgentSummary } from "@/lib/agent/summary";
import type { AgentAction } from "@/lib/agent/tools";
import { downloadIcs } from "@/lib/clipboard";
import { evaluateTrial } from "@/lib/stats/verdict";
import { useAllTrials, useTrial } from "@/lib/useTrial";

interface Msg {
  role: "user" | "assistant";
  content: string;
  actions?: AgentAction[];
  offline?: boolean;
}

const SUGGESTED = ["Is it working?", "Why do you compare sides?", "What if I missed days?", "Draft my return"];

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

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { data } = useTrial(id);
  const { list } = useAllTrials();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
    <AppShell back={`/trial/${t.id}`} title="Trial assistant" action={t.isDemo ? <DemoBadge /> : undefined}>
      <div className="space-y-3 pb-32" aria-live="polite">
        <div className="rounded-panel border border-line bg-card p-4">
          <p>
            I manage your {t.products.A.name} trial. Every number I give comes from your measurements. I never see your photos — only the numbers.
          </p>
        </div>
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-10 rounded-panel bg-ink p-4 text-white" : "mr-6 rounded-panel border border-line bg-card p-4"}>
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
            {m.offline && <p className="mt-2 text-xs text-muted">Answered from your trial data without the AI assistant.</p>}
          </div>
        ))}
        {busy && (
          <p className="text-sm text-muted" role="status">
            Checking your measurements…
          </p>
        )}
        <div ref={end} />
      </div>

      <div className="fixed inset-x-0 bottom-14 z-10 mx-auto max-w-md bg-paper/95 px-4 pb-3 pt-2 backdrop-blur">
        {msgs.length === 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => ask(s)} className="min-h-10 shrink-0 rounded-full border border-line bg-card px-3 text-sm font-medium">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input className={inputClass} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your trial" aria-label="Message" maxLength={500} />
          <Button type="submit" disabled={busy || !input.trim()} className="shrink-0 px-5">
            Send
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
