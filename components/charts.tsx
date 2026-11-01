"use client";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { theilSen, type ConcernSeries } from "@/lib/stats/series";
import { Panel } from "./ui";
import { noisePercent } from "./VerdictBadge";

/** Δ as "% more (+) or less (−) detected area on the treated side than expected". */
const pct = (delta: number) => Math.round((Math.exp(delta) - 1) * 100);

const TICK = { fill: "var(--color-ink)", fillOpacity: 0.7 };
const TOOLTIP = {
  contentStyle: { background: "var(--color-raised)", border: "none", borderRadius: 16, boxShadow: "var(--shadow-float)" },
  labelStyle: { color: "var(--color-ink)" },
  itemStyle: { color: "var(--color-ink)" },
  cursor: { stroke: "var(--color-line)" },
};
// Lines draw themselves in; Recharts' default "auto" already skips this under reduced motion.
const DRAW = { animationDuration: 1100, animationEasing: "ease-out" } as const;

export function DeltaChart({ series }: { series: ConcernSeries }) {
  const { sdc } = series.baseline;
  // The engine's thresholds on this axis: "working" is Δ ≤ −sdc, "worse" is Δ ≥ sdc, so the edges differ slightly.
  const low = pct(-sdc);
  const high = pct(sdc);
  const noise = noisePercent(sdc);
  const fit = theilSen(series.post);
  const data = [{ day: 0, value: 0 }, ...series.post.map((p) => ({ day: p.day, value: pct(p.delta) }))].map((d) => ({
    ...d,
    band: [low, high] as [number, number],
    trend: fit ? pct(fit.intercept + fit.slope * d.day) : undefined,
  }));
  const extent = Math.ceil((Math.max(high * 1.6, ...data.map((d) => Math.abs(d.value))) + 2) / 10) * 10;
  return (
    <figure>
      <div className="h-56" role="img" aria-label={`Treated versus control change by day, noise band about plus or minus ${noise} percent`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} accessibilityLayer={false} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="day" type="number" domain={[0, "dataMax"]} allowDecimals={false} tickLine={false} axisLine={false} tick={TICK} fontSize={12} tickFormatter={(d) => `d${d}`} />
            <YAxis domain={[-extent, extent]} ticks={[-extent, -extent / 2, 0, extent / 2, extent]} tickLine={false} axisLine={false} tick={TICK} fontSize={12} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Area dataKey="band" fill="var(--color-ink)" fillOpacity={0.1} stroke="none" isAnimationActive={false} />
            <ReferenceLine y={0} stroke="var(--color-ink)" strokeOpacity={0.35} />
            <Line dataKey="trend" stroke="var(--color-ink)" strokeOpacity={0.6} strokeDasharray="4 4" dot={false} {...DRAW} />
            <Line dataKey="value" type="monotone" stroke="var(--color-treated)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-card)", stroke: "var(--color-treated)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--color-treated)", stroke: "var(--color-card)" }} {...DRAW} />
            <Tooltip {...TOOLTIP} formatter={(v, name) => (name === "value" ? [`${v}%`, "Treated vs control"] : null)} labelFormatter={(d) => `Day ${d}`} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-3 text-sm text-ink/70">
        Grey band = your personal noise range (about ±{noise}%). Below the band means the treated side is improving; above means it is getting worse. Dotted line = trend.
      </figcaption>
      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.day}>Day {d.day}: {d.value}%</li>
        ))}
      </ul>
    </figure>
  );
}

/** "Context cancels out": whole-face score moves with sleep and weather; treated-minus-control stays steady. */
export function ContextChart({ series, notes }: { series: ConcernSeries; notes: Record<number, string> }) {
  const data = series.post
    .filter((p) => p.wholeFaceRaw !== undefined)
    .map((p) => ({ day: p.day, whole: Math.round(p.wholeFaceRaw!), delta: pct(p.delta), note: notes[p.day] }));
  if (data.length < 2) return null;
  const noted = data.filter((d) => d.note);
  return (
    <Panel className="mt-3">
      <h2 className="text-lg font-normal">Why a bad night doesn&apos;t ruin the result</h2>
      <figure className="mt-4">
        <div className="h-44" role="img" aria-label="Whole-face score compared with the treated versus control difference">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} accessibilityLayer={false} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={TICK} fontSize={12} tickFormatter={(d) => `d${d}`} />
              <YAxis yAxisId="w" tickLine={false} axisLine={false} tick={TICK} fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
              <YAxis yAxisId="d" orientation="right" hide domain={[-60, 60]} />
              <Line yAxisId="w" dataKey="whole" type="monotone" stroke="var(--color-control)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-card)", stroke: "var(--color-control)", strokeWidth: 2 }} {...DRAW} />
              <Line yAxisId="d" dataKey="delta" type="monotone" stroke="var(--color-treated)" strokeWidth={2} dot={false} {...DRAW} />
              <Tooltip
                {...TOOLTIP}
                formatter={(v, name) => (name === "whole" ? [v, "Whole-face score"] : [`${v}%`, "Treated vs control"])}
                labelFormatter={(d, p) => `Day ${d}${p?.[0]?.payload?.note ? ` · ${p[0].payload.note}` : ""}`}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="mt-3 text-sm text-ink/70">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-control" aria-hidden="true" />
          <span className="text-ink">Whole-face score</span> jumps with sleep, stress and weather.{" "}
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-treated" aria-hidden="true" />
          <span className="text-ink">Treated vs control</span> ignores them, because they hit both sides.
        </figcaption>
        {noted.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {noted.map((d) => (
              <li key={d.day}>
                <span className="text-ink/70">Day {d.day}:</span> {d.note}
              </li>
            ))}
          </ul>
        )}
      </figure>
    </Panel>
  );
}
