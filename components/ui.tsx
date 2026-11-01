import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors disabled:opacity-40";
const variants = {
  primary: "bg-ink text-white hover:bg-ink/85",
  secondary: "border border-line bg-card text-ink hover:border-ink/40",
  danger: "bg-stop text-white hover:bg-stop/90",
  ghost: "text-ink underline-offset-4 hover:underline",
};
type Variant = keyof typeof variants;

export function Button({ variant = "primary", className = "", ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...p} />;
}

export function ButtonLink({ variant = "primary", className = "", ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...p} />;
}

export function Panel({ children, className = "", tone }: { children: ReactNode; className?: string; tone?: "good" | "stop" | "treated" | "control" }) {
  const tones = { good: "bg-good-soft", stop: "bg-stop-soft", treated: "bg-treated-soft", control: "bg-control-soft" };
  return <section className={`rounded-panel p-5 ${tone ? tones[tone] : "border border-line bg-card"} ${className}`}>{children}</section>;
}

export function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-dashed border-muted px-2.5 py-0.5 text-xs font-medium text-muted" title="Seeded example data, not a real measurement">
      Demo data
    </span>
  );
}

export function SideTag({ kind, children }: { kind: "treated" | "control"; children: ReactNode }) {
  const c = kind === "treated" ? "bg-treated-soft text-treated" : "bg-control-soft text-control";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export const inputClass = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-treated";
