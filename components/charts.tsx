"use client";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { theilSen, type ConcernSeries } from "@/lib/stats/series";

/** Δ as "% more (+) or less (−) detected area on the treated side than expected". */
const pct = (delta: number) => Math.round((Math.exp(delta) - 1) * 100);

export function DeltaChart({ series }: { series: ConcernSeries }) {
  const band = pct(series.baseline.sdc);
  const fit = theilSen(series.post);
  const data = [{ day: 0, value: 0 }, ...series.post.map((p) => ({ day: p.day, value: pct(p.delta) }))].map((d) => ({
    ...d,
    band: [-band, band] as [number, number],
    trend: fit ? pct(fit.intercept + fit.slope * d.day) : undefined,
  }));
  const extent = Math.ceil((Math.max(band * 1.6, ...data.map((d) => Math.abs(d.value))) + 2) / 10) * 10;
  return (
    <figure>
      <div className="h-56" role="img" aria-label={`Treated versus control change by day, noise band plus or minus ${band} percent`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="day" type="number" domain={[0, "dataMax"]} tickLine={false} axisLine={false} fontSize={12} tickFormatter={(d) => `d${d}`} />
            <YAxis domain={[-extent, extent]} ticks={[-extent, -extent / 2, 0, extent / 2, extent]} tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Area dataKey="band" fill="var(--color-muted)" fillOpacity={0.12} stroke="none" isAnimationActive={false} />
            <ReferenceLine y={0} stroke="var(--color-muted)" />
            <Line dataKey="trend" stroke="var(--color-muted)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="value" stroke="var(--color-treated)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-treated)" }} isAnimationActive={false} />
            <Tooltip formatter={(v, name) => (name === "value" ? [`${v}%`, "Treated vs control"] : null)} labelFormatter={(d) => `Day ${d}`} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        Grey band = your personal noise range (±{band}%). Below the band means the treated cheek is improving; above means it is getting worse. Dotted line = trend.
      </figcaption>
    </figure>
  );
}

/** "Context cancels out": whole-face score moves with sleep and weather; treated-minus-control stays steady. */
export function ContextChart({ series, notes }: { series: ConcernSeries; notes: Record<number, string> }) {
  const data = series.post
    .filter((p) => p.wholeFaceRaw !== undefined)
    .map((p) => ({ day: p.day, whole: Math.round(p.wholeFaceRaw!), delta: pct(p.delta), note: notes[p.day] }));
  if (data.length < 2) return null;
  return (
    <figure>
      <div className="h-44" role="img" aria-label="Whole-face score compared with the treated versus control difference">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(d) => `d${d}`} />
            <YAxis yAxisId="w" tickLine={false} axisLine={false} fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
            <YAxis yAxisId="d" orientation="right" hide domain={[-60, 60]} />
            <Line yAxisId="w" dataKey="whole" stroke="var(--color-control)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            <Line yAxisId="d" dataKey="delta" stroke="var(--color-treated)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Tooltip
              formatter={(v, name) => (name === "whole" ? [v, "Whole-face score"] : [`${v}%`, "Treated vs control"])}
              labelFormatter={(d, p) => `Day ${d}${p?.[0]?.payload?.note ? ` · ${p[0].payload.note}` : ""}`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        <span className="font-medium text-control">Whole-face score</span> jumps with sleep, stress and weather.{" "}
        <span className="font-medium text-treated">Treated vs control</span> ignores them, because they hit both cheeks.
      </figcaption>
    </figure>
  );
}
