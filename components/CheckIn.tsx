"use client";
import { CloudSun } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { currentPosition, fetchLocalContext, type LocalContext } from "@/lib/integrations/localContext";
import { STOP_ADVICE } from "@/lib/stats/sentinel";
import type { Scan, ScanContext } from "@/lib/types";
import { Button, Field, Panel, inputClass } from "./ui";

/** "4 h sleep, stress 4/5, 41% humidity, AQI 182": the one way a scan's context is written anywhere. */
export function contextNote(c: ScanContext): string {
  return [
    c.sleepHours !== undefined && `${c.sleepHours} h sleep`,
    c.stress && `stress ${c.stress}/5`,
    c.period && "period",
    c.humidity !== undefined && `${c.humidity}% humidity`,
    c.aqi !== undefined && `AQI ${c.aqi}`,
    c.tempC !== undefined && `${c.tempC}°C`,
    c.uvIndex !== undefined && `UV ${Math.round(c.uvIndex)}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function Choice({ on, ...p }: ComponentProps<"button"> & { on: boolean }) {
  return <button type="button" aria-pressed={on} className={`min-h-12 flex-1 rounded-full px-3 text-sm transition-colors ${on ? "bg-forest text-white" : "bg-raised text-ink shadow-[var(--shadow-soft)]"}`} {...p} />;
}

/** Opt-in: location is only asked for on tap. A denial or miss leaves a note and never holds up saving. */
function LocalContextField({ value, onChange }: { value: LocalContext | null; onChange: (v: LocalContext | null) => void }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const add = async () => {
    setState("busy");
    const position = await currentPosition();
    const found = position && (await fetchLocalContext(position.coords.latitude, position.coords.longitude));
    onChange(found);
    setState(found ? "idle" : "failed");
  };
  return (
    <div>
      {value ? (
        <p className="flex items-center gap-2 rounded-2xl bg-raised px-4 py-3">
          <CloudSun size={18} className="shrink-0" aria-hidden="true" />
          {contextNote(value)}
        </p>
      ) : (
        <Button variant="secondary" className="w-full" disabled={state === "busy"} onClick={add}>
          <CloudSun size={18} aria-hidden="true" />
          {state === "busy" ? "Checking today's weather…" : "Add weather and air quality for today"}
        </Button>
      )}
      {state === "failed" && <p className="mt-2 text-sm" role="status">Couldn&apos;t get the weather. You can save without it.</p>}
      <p className="mt-2 text-sm text-ink/70">Your location is rounded to about 10 km before it reaches the weather service, and it is not stored.</p>
    </div>
  );
}

/** Post-scan check-in: adherence (C8), symptoms (sentinel override), optional context (C9). */
export function CheckIn({ onDone }: { onDone: (patch: Partial<Scan>) => Promise<void> }) {
  const [applied, setApplied] = useState<"yes" | "some" | null>(null);
  const [symptoms, setSymptoms] = useState<boolean | null>(null);
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState<number | null>(null);
  const [period, setPeriod] = useState(false);
  const [local, setLocal] = useState<LocalContext | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <Panel>
        <h2 className="text-lg font-normal">Applied it as planned since the last scan?</h2>
        <div className="mt-3 flex gap-2">
          <Choice on={applied === "yes"} onClick={() => setApplied("yes")}>Yes, every day</Choice>
          <Choice on={applied === "some"} onClick={() => setApplied("some")}>Missed some days</Choice>
        </div>
      </Panel>
      <Panel tone={symptoms ? "stop" : undefined}>
        <h2 className="text-lg font-normal">Any burning, stinging, itching or swelling on the treated side?</h2>
        <div className="mt-3 flex gap-2">
          <Choice on={symptoms === false} onClick={() => setSymptoms(false)}>No</Choice>
          <Choice on={symptoms === true} onClick={() => setSymptoms(true)}>Yes</Choice>
        </div>
        {symptoms && <p className="mt-3" role="alert">{STOP_ADVICE} We&apos;ll mark this trial as stopped.</p>}
      </Panel>
      <Panel>
        <h2 className="text-lg font-normal">Optional: what else happened?</h2>
        <p className="mt-1 text-sm text-ink/70">These affect both cheeks, so the verdict ignores them. Logging them shows you that.</p>
        <div className="mt-4 space-y-4">
          <Field label="Hours of sleep last night">
            <input className={inputClass} inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="e.g. 7" />
          </Field>
          <div role="group" aria-labelledby="checkin-stress">
            <span id="checkin-stress" className="text-sm font-semibold">Stress today</span>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Choice key={n} on={stress === n} onClick={() => setStress(n)} aria-label={`Stress ${n} of 5`}>
                  {n}
                </Choice>
              ))}
            </div>
          </div>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-forest" checked={period} onChange={(e) => setPeriod(e.target.checked)} />
            On my period
          </label>
          <LocalContextField value={local} onChange={setLocal} />
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
              ...local,
            },
          });
        }}
      >
        Save check-in
      </Button>
    </div>
  );
}
