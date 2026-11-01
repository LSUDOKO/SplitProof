"use client";
import { useState } from "react";
import type { Scan } from "@/lib/types";
import { Button, Field, Panel, inputClass } from "./ui";

/** Post-scan check-in: adherence (C8), symptoms (sentinel override), optional context (C9). */
export function CheckIn({ onDone }: { onDone: (patch: Partial<Scan>) => Promise<void> }) {
  const [applied, setApplied] = useState<"yes" | "some" | null>(null);
  const [symptoms, setSymptoms] = useState<boolean | null>(null);
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState<number | null>(null);
  const [period, setPeriod] = useState(false);
  const [busy, setBusy] = useState(false);
  const choice = (on: boolean) => `min-h-12 flex-1 rounded-xl border px-3 font-medium ${on ? "border-ink bg-ink text-white" : "border-line bg-card"}`;
  return (
    <div className="space-y-4">
      <Panel>
        <p className="font-semibold">Applied it as planned since the last scan?</p>
        <div className="mt-3 flex gap-2">
          <button className={choice(applied === "yes")} onClick={() => setApplied("yes")}>Yes, every day</button>
          <button className={choice(applied === "some")} onClick={() => setApplied("some")}>Missed some days</button>
        </div>
      </Panel>
      <Panel tone={symptoms ? "stop" : undefined}>
        <p className="font-semibold">Any burning, stinging, itching or swelling on the treated side?</p>
        <div className="mt-3 flex gap-2">
          <button className={choice(symptoms === false)} onClick={() => setSymptoms(false)}>No</button>
          <button className={choice(symptoms === true)} onClick={() => setSymptoms(true)}>Yes</button>
        </div>
        {symptoms && <p className="mt-3 text-sm">Stop using the product now and rinse with water. We&apos;ll mark this trial as stopped.</p>}
      </Panel>
      <Panel>
        <p className="font-semibold">Optional: what else happened?</p>
        <p className="text-sm text-muted">These affect both cheeks, so the verdict ignores them. Logging them shows you that.</p>
        <div className="mt-3 space-y-3">
          <Field label="Hours of sleep last night">
            <input className={inputClass} inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="e.g. 7" />
          </Field>
          <div>
            <span className="text-sm font-semibold">Stress today</span>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={choice(stress === n)} onClick={() => setStress(n)} aria-label={`Stress ${n} of 5`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={period} onChange={(e) => setPeriod(e.target.checked)} />
            On my period
          </label>
        </div>
      </Panel>
      <Button
        className="w-full"
        disabled={applied === null || symptoms === null || busy}
        onClick={async () => {
          setBusy(true);
          const sleepHours = Number.parseFloat(sleep);
          await onDone({
            adherenceSinceLast: applied === "yes" ? 1 : 0.6,
            symptoms: symptoms ?? false,
            context: {
              sleepHours: Number.isFinite(sleepHours) ? sleepHours : undefined,
              stress: (stress ?? undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
              period: period || undefined,
            },
          });
        }}
      >
        Save check-in
      </Button>
    </div>
  );
}
