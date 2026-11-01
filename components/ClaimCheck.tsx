"use client";
/* eslint-disable @next/next/no-img-element -- local blob: URLs */
import { useEffect, useMemo, useState } from "react";
import { dataUrlToBlob } from "@/lib/capture/frame";
import { media as mediaRepo, settings } from "@/lib/db";
import type { TrialVerdict } from "@/lib/stats/verdict";
import type { Scan, Trial } from "@/lib/types";
import { CONCERN_LABELS } from "@/lib/youcam/concerns";
import { CLAIM_STRENGTHS, SIMULATION_PARAM, simulationParams } from "@/lib/youcam/simulation";
import { Button, Panel } from "./ui";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function useUrl(blob?: Blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url;
}

/**
 * Claim Check (D4): "What the brand promises" (AI Skin Simulation on your baseline photo, always
 * labelled as a simulation) next to "What actually happened" (the measured effect on your latest scan).
 */
export function ClaimCheck({ trial, scans, verdict }: { trial: Trial; scans: Scan[]; verdict: TrialVerdict }) {
  const key = `claim:${trial.id}`;
  const goals = trial.goals.filter((g) => SIMULATION_PARAM[g]);
  const first = scans.find((s) => s.isBaseline);
  const last = [...scans].reverse().find((s) => !s.isBaseline);
  const [sim, setSim] = useState<Blob | undefined>();
  const [real, setReal] = useState<Blob | undefined>();
  const [strength, setStrength] = useState<number>(CLAIM_STRENGTHS[1].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const simUrl = useUrl(sim);
  const realUrl = useUrl(real);

  useEffect(() => {
    let alive = true;
    settings.get<Blob>(key).then((b) => alive && b && setSim(b));
    if (last) mediaRepo.get(last.id).then((m) => alive && m && setReal(m.image));
    return () => {
      alive = false;
    };
  }, [key, last]);

  if (!first || goals.length === 0) return null;
  const lead = verdict.concerns.find((c) => goals.includes(c.concern)) ?? verdict.concerns[0];

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const base = await mediaRepo.get(first.id);
      if (!base) throw new Error("Your baseline photo isn't stored on this device.");
      const form = new FormData();
      form.set("image", base.image, "baseline.jpg");
      form.set("kind", "skin-simulation");
      form.set("params", JSON.stringify(simulationParams(goals, strength)));
      const created = await (await fetch("/api/preview", { method: "POST", body: form })).json();
      if (!created.taskId) throw new Error(created.message ?? "Simulation failed.");
      for (let i = 0; i < 45; i++) {
        await sleep(2000);
        const r = await (await fetch(`/api/preview/${encodeURIComponent(created.taskId)}?kind=skin-simulation`)).json();
        if (r.status === "success") {
          const blob = await dataUrlToBlob(r.image);
          await settings.set(key, blob);
          setSim(blob);
          return;
        }
        if (r.status === "error") throw new Error(r.message);
      }
      throw new Error("The simulation took too long. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="mt-3">
      <h2 className="text-lg font-normal">Claim check</h2>
      <p className="mt-1 text-sm text-ink/70">See what the brand&apos;s promise would look like on your baseline photo, next to what your scans measured.</p>
      {!sim ? (
        <>
          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm font-semibold">How strong is the claim on the box?</legend>
            {CLAIM_STRENGTHS.map((c) => (
              <label key={c.value} className="flex min-h-11 items-center gap-3 rounded-2xl bg-raised px-4 shadow-[var(--shadow-soft)]">
                <input type="radio" name="claim" className="h-4 w-4 shrink-0 accent-forest" checked={strength === c.value} onChange={() => setStrength(c.value)} />
                {c.label}
              </label>
            ))}
          </fieldset>
          <Button className="mt-4 w-full" onClick={run} disabled={busy}>
            {busy ? "Simulating…" : `Simulate the claim (${goals.map((g) => CONCERN_LABELS[g].toLowerCase()).join(", ")})`}
          </Button>
          {error && <p className="mt-2 text-sm text-stop" role="alert">{error}</p>}
        </>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <figure>
            <div className="relative overflow-hidden rounded-2xl bg-night" style={{ aspectRatio: "3 / 4" }}>
              <img src={simUrl} alt="Simulation of the brand's claim on your baseline photo" className="h-full w-full -scale-x-100 object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-night/70 px-2.5 py-0.5 text-xs text-white">Simulation</span>
            </div>
            <figcaption className="mt-2 text-sm">What the brand promises</figcaption>
          </figure>
          <figure>
            <div className="relative overflow-hidden rounded-2xl bg-night" style={{ aspectRatio: "3 / 4" }}>
              {realUrl && <img src={realUrl} alt="Your latest real scan" className="h-full w-full -scale-x-100 object-cover" />}
              <span className="absolute left-2 top-2 rounded-full bg-night/70 px-2.5 py-0.5 text-xs text-white">Measured</span>
            </div>
            <figcaption className="mt-2 text-sm">
              What happened: {lead && lead.series?.post.length ? `${Math.abs(lead.effectPct)}% ${lead.effectPct >= 0 ? "less" : "more"} ${CONCERN_LABELS[lead.concern].toLowerCase()} on the treated cheek` : "not enough scans yet"}
            </figcaption>
          </figure>
          <p className="col-span-2 text-sm text-ink/70">The simulation is generated by YouCam AI. It is not a prediction and never affects your verdict.</p>
        </div>
      )}
    </Panel>
  );
}
