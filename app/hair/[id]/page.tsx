"use client";
import { Camera, Check } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { Button, ButtonLink, DemoBadge, Panel } from "@/components/ui";
import { hairTrials } from "@/lib/db";
import { runHairCheck, prepareView } from "@/lib/hair/client";
import { FRIZZ_TERMS, HAIR_VERDICT_TEXT, judgeHair, type HairCheck, type HairTrial } from "@/lib/hair/model";

const VIEWS = [
  { key: "front", label: "Front", hint: "Look straight at the camera." },
  { key: "left", label: "Your left side", hint: "Turn your head to the right so the camera sees your left side." },
  { key: "right", label: "Your right side", hint: "Turn your head to the left so the camera sees your right side." },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

/** Same blue/amber pair as everywhere, but ink text: coloured text on these tints misses 4.5:1 in light. */
function SideChip({ kind, children }: { kind: "treated" | "control"; children: ReactNode }) {
  const [tint, dot] = kind === "treated" ? ["bg-treated-soft", "bg-treated"] : ["bg-control-soft", "bg-control"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${tint}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function CheckInTimeline({ checks }: { checks: HairCheck[] }) {
  return (
    <Reveal as="ol" stagger={0.07} className="mt-4 space-y-4 border-l-2 border-line pl-4">
      {checks.map((c) => (
        <li key={c.at} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-forest-deep" aria-hidden="true" />
          <p className="text-sm">{c.isBaseline ? "Baseline" : `Day ${c.day}`}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <SideChip kind="treated">Treated: {FRIZZ_TERMS[c.treated]}</SideChip>
            <SideChip kind="control">Control: {FRIZZ_TERMS[c.control]}</SideChip>
          </div>
        </li>
      ))}
    </Reveal>
  );
}

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

  if (trial === undefined) return <AppShell back="/hair"><p className="mt-6 text-ink/70" role="status">Loading…</p></AppShell>;
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
      <h2 className="mt-2 text-[1.7rem] font-normal leading-tight tracking-tight">{trial.product}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <SideChip kind="treated">Product: your {trial.treatedSide.toUpperCase()} side</SideChip>
        <SideChip kind="control">Control: your {control} side</SideChip>
      </div>

      <Panel className="mt-4" tone={v.verdict === "less_frizz" ? "good" : v.verdict === "more_frizz" ? "stop" : undefined}>
        <p className="text-lg leading-snug">{HAIR_VERDICT_TEXT[v.verdict]}</p>
        {v.diffs.length > 0 && <p className="mt-2 text-sm text-ink/70">Confidence: {v.confidence}. Frizz is rated in 4 steps, so small changes don&apos;t show.</p>}
      </Panel>

      {trial.checks.length > 0 && (
        <Panel className="mt-3">
          <h3 className="text-lg font-normal">Check-ins</h3>
          <CheckInTimeline checks={trial.checks} />
        </Panel>
      )}

      {!trial.isDemo && (
        <Panel className="mt-3">
          <h3 className="text-lg font-normal">{isBaseline ? "Baseline check (before using the product)" : "New check-in"}</h3>
          <p className="mt-1 text-sm text-ink/70">Same place, same light, hair styled the usual way. Uses about 4 YouCam units.</p>
          <ul className="mt-3 space-y-2">
            {VIEWS.map((x) => (
              <li key={x.key}>
                <label className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-ink ${views[x.key] ? "bg-good-soft" : "bg-raised"}`}>
                  <span className="min-w-0">
                    {x.label}
                    <span className="block text-sm text-ink/70">{x.hint}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm">
                    {views[x.key] ? <Check size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                    {views[x.key] ? "Added" : "Add photo"}
                  </span>
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
          <Button className={`mt-4 w-full ${busy ? "motion-safe:[animation:breathe_1.4s_ease-in-out_infinite]" : ""}`} disabled={!ready || busy} onClick={checkIn}>
            {busy ? "Rating frizz on each side…" : "Rate both sides"}
          </Button>
          {error && <p className="mt-2 text-sm text-stop" role="alert">{error}</p>}
        </Panel>
      )}
    </AppShell>
  );
}
