"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink, DemoBadge, Panel, SideTag } from "@/components/ui";
import { hairTrials } from "@/lib/db";
import { runHairCheck, prepareView } from "@/lib/hair/client";
import { FRIZZ_TERMS, HAIR_VERDICT_TEXT, judgeHair, type HairTrial } from "@/lib/hair/model";

const VIEWS = [
  { key: "front", label: "Front", hint: "Look straight at the camera." },
  { key: "left", label: "Your left side", hint: "Turn your head to the right so the camera sees your left side." },
  { key: "right", label: "Your right side", hint: "Turn your head to the left so the camera sees your right side." },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

export default function HairTrialPage() {
  const { id } = useParams<{ id: string }>();
  const [trial, setTrial] = useState<HairTrial | null | undefined>(undefined);
  const [views, setViews] = useState<Partial<Record<ViewKey, Blob>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    hairTrials.get(id).then((t) => alive && setTrial(t ?? null));
    return () => {
      alive = false;
    };
  }, [id]);

  if (trial === undefined) return <AppShell back="/hair"><p className="mt-6 text-muted" role="status">Loading…</p></AppShell>;
  if (trial === null)
    return (
      <AppShell back="/hair">
        <p className="mt-6">This hair trial isn&apos;t on this device.</p>
        <ButtonLink href="/hair" className="mt-4">Back to hair trials</ButtonLink>
      </AppShell>
    );

  const v = judgeHair(trial);
  const control = trial.treatedSide === "left" ? "right" : "left";
  const ready = VIEWS.every((x) => views[x.key]);
  const isBaseline = !trial.checks.some((c) => c.isBaseline);

  const checkIn = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await runHairCheck(views as Record<ViewKey, Blob>, trial.treatedSide);
      const day = Math.max(0, Math.floor((Date.now() - Date.parse(trial.createdAt)) / 86_400_000));
      const next = { ...trial, checks: [...trial.checks, { at: new Date().toISOString(), day: isBaseline ? 0 : Math.max(1, day), isBaseline, treated: r.treated.level, control: r.control.level }] };
      await hairTrials.put(next);
      setTrial(next);
      setViews({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "The hair check failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell back="/hair" title="SplitHair (beta)" action={trial.isDemo ? <DemoBadge /> : undefined}>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">{trial.product}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <SideTag kind="treated">Product: your {trial.treatedSide.toUpperCase()} side</SideTag>
        <SideTag kind="control">Control: your {control} side</SideTag>
      </div>

      <Panel className="mt-4" tone={v.verdict === "less_frizz" ? "good" : v.verdict === "more_frizz" ? "stop" : undefined}>
        <p className="font-semibold">{HAIR_VERDICT_TEXT[v.verdict]}</p>
        {v.diffs.length > 0 && <p className="mt-1 text-sm text-muted">Confidence: {v.confidence}. Frizz is rated in 4 steps, so small changes don&apos;t show.</p>}
      </Panel>

      {trial.checks.length > 0 && (
        <Panel className="mt-3">
          <h2 className="font-semibold">Check-ins</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 font-medium">Day</th>
                <th className="pb-2 font-medium text-treated">Treated</th>
                <th className="pb-2 font-medium text-control">Control</th>
              </tr>
            </thead>
            <tbody>
              {trial.checks.map((c) => (
                <tr key={c.at} className="border-t border-line">
                  <td className="py-2">{c.isBaseline ? "Baseline" : `Day ${c.day}`}</td>
                  <td>{FRIZZ_TERMS[c.treated]}</td>
                  <td>{FRIZZ_TERMS[c.control]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {!trial.isDemo && (
        <Panel className="mt-3">
          <h2 className="font-semibold">{isBaseline ? "Baseline check (before using the product)" : "New check-in"}</h2>
          <p className="mt-1 text-sm text-muted">Same place, same light, hair styled the usual way. Uses about 4 YouCam units.</p>
          <ul className="mt-3 space-y-2">
            {VIEWS.map((x) => (
              <li key={x.key}>
                <label className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 ${views[x.key] ? "border-good bg-good-soft" : "border-line"}`}>
                  <span>
                    <span className="font-semibold">{x.label}</span>
                    <span className="block text-sm text-muted">{x.hint}</span>
                  </span>
                  <span className="text-sm font-semibold">{views[x.key] ? "✓ Added" : "Add photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    capture="user"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setViews({ ...views, [x.key]: await prepareView(f) });
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" disabled={!ready || busy} onClick={checkIn}>
            {busy ? "Rating frizz on each side…" : "Rate both sides"}
          </Button>
          {error && <p className="mt-2 text-sm text-stop" role="alert">{error}</p>}
        </Panel>
      )}
    </AppShell>
  );
}
