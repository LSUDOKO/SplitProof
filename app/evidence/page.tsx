import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { DemoBadge, Panel } from "@/components/ui";
import { EVIDENCE } from "@/lib/demo/evidence";

export const metadata: Metadata = { title: "Evidence board" };

const pct = (a: number, b: number) => Math.round((a / b) * 100);

export default function Evidence() {
  return (
    <AppShell action={<DemoBadge />}>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Evidence board</h1>
      <p className="mt-1 text-muted">Anonymous split-face results from home trials, pooled per product. No photos, no names.</p>
      <p className="mt-3 rounded-xl border border-dashed border-muted p-3 text-sm text-muted">
        These numbers are example data to show how the board works. Sharing your own anonymous results is coming next.
      </p>
      <div className="mt-4 space-y-3">
        {EVIDENCE.map((e) => (
          <Panel key={e.product}>
            <h2 className="font-semibold">{e.product}</h2>
            <p className="mt-1 text-muted">
              {e.trials} home split-face trials for {e.concern.toLowerCase()}: <span className="font-semibold text-good">{pct(e.working, e.trials)}% working</span>, {pct(e.noDifference, e.trials)}% no difference,{" "}
              <span className={e.stopped ? "font-semibold text-stop" : ""}>{pct(e.stopped, e.trials)}% stopped for irritation</span>.
            </p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full" role="img" aria-label={`${pct(e.working, e.trials)}% working`}>
              <span className="bg-good" style={{ width: `${pct(e.working, e.trials)}%` }} />
              <span className="bg-line" style={{ width: `${pct(e.noDifference, e.trials)}%` }} />
              <span className="bg-stop" style={{ width: `${pct(e.stopped, e.trials)}%` }} />
            </div>
            <table className="mt-3 w-full text-left text-sm">
              <caption className="sr-only">Results by Fitzpatrick skin type</caption>
              <thead className="text-muted">
                <tr>
                  <th className="font-medium">Skin type (Fitzpatrick)</th>
                  <th className="font-medium">Trials</th>
                  <th className="font-medium">Working</th>
                </tr>
              </thead>
              <tbody>
                {e.byFitzpatrick.map((f) => (
                  <tr key={f.group} className="border-t border-line">
                    <td className="py-1.5">{f.group}</td>
                    <td>{f.trials}</td>
                    <td>{pct(f.working, f.trials)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
