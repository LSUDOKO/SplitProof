import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { DemoBadge, Panel } from "@/components/ui";
import { EVIDENCE, type EvidenceRow } from "@/lib/demo/evidence";

export const metadata: Metadata = { title: "Evidence board" };

const pct = (a: number, b: number) => Math.round((a / b) * 100);

/** Each segment slides up into its overflow-hidden track, left to right, as the card scrolls in. */
function OutcomeBar({ e }: { e: EvidenceRow }) {
  const segments = [
    { key: "working", tone: "bg-good", count: e.working },
    { key: "noDifference", tone: "bg-muted", count: e.noDifference },
    { key: "stopped", tone: "bg-stop", count: e.stopped },
  ].filter((s) => s.count > 0);
  return (
    <div role="img" aria-label={`${pct(e.working, e.trials)}% working, ${pct(e.noDifference, e.trials)}% no difference, ${pct(e.stopped, e.trials)}% stopped for irritation`}>
      <Reveal scroll stagger={0.16} y={16} className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-raised">
        {segments.map((s) => (
          <span key={s.key} className={`basis-0 ${s.tone}`} style={{ flexGrow: s.count }} />
        ))}
      </Reveal>
    </div>
  );
}

function SkinTypeRow({ group, trials, working }: EvidenceRow["byFitzpatrick"][number]) {
  const share = pct(working, trials);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>
          Type {group} · {trials} trials
        </span>
        <span>{share}% working</span>
      </div>
      {/* stagger makes Reveal move the fill, not the track. */}
      <Reveal scroll stagger={0.01} y={8} className="mt-1 h-2 overflow-hidden rounded-full bg-raised">
        <span className="block h-full rounded-full bg-good" style={{ width: `${share}%` }} />
      </Reveal>
    </li>
  );
}

function EvidenceCard({ e }: { e: EvidenceRow }) {
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <ProductArt name={e.product} size={56} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-normal leading-snug">{e.product}</h2>
          <p className="mt-0.5 text-sm text-ink/70">
            {e.trials} home split-face trials for {e.concern.toLowerCase()}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-4xl font-light tracking-tight text-good tabular-nums">
          {pct(e.working, e.trials)}% <span className="text-base font-normal">working</span>
        </p>
        <DemoBadge />
      </div>
      <div className="mt-2">
        <OutcomeBar e={e} />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted" aria-hidden="true" />
          {pct(e.noDifference, e.trials)}% no difference
        </li>
        <li className={`flex items-center gap-1.5 ${e.stopped ? "text-stop" : ""}`}>
          <span className="h-2 w-2 rounded-full bg-stop" aria-hidden="true" />
          {pct(e.stopped, e.trials)}% stopped for irritation
        </li>
      </ul>
      <h3 className="mt-4 text-sm text-ink/70">By skin type (Fitzpatrick)</h3>
      <ul className="mt-2 space-y-2">
        {e.byFitzpatrick.map((f) => (
          <SkinTypeRow key={f.group} {...f} />
        ))}
      </ul>
    </Panel>
  );
}

export default function Evidence() {
  return (
    <AppShell action={<DemoBadge />}>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">Evidence board</h1>
      <p className="mt-1 text-ink/70">Anonymous split-face results from home trials, pooled per product. No photos, no names.</p>
      <Panel tone="control" className="mt-4">
        <div className="flex items-start gap-3">
          <FlaskConical size={20} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-lg leading-snug">Demo data</p>
            <p className="mt-1 text-sm">These numbers are example data to show how the board works. Sharing your own anonymous results is coming next.</p>
          </div>
        </div>
      </Panel>
      <div className="mt-4 space-y-3">
        {EVIDENCE.map((e) => (
          <Reveal key={e.product} scroll>
            <EvidenceCard e={e} />
          </Reveal>
        ))}
      </div>
    </AppShell>
  );
}
