import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-[background-color,transform] active:scale-[0.97] disabled:opacity-40";
const variants = {
  primary: "bg-forest text-white shadow-[var(--shadow-soft)] hover:bg-forest-deep",
  secondary: "bg-raised text-ink shadow-[var(--shadow-soft)] hover:brightness-105",
  danger: "bg-stop text-white hover:bg-stop/90",
  ghost: "text-forest underline-offset-4 hover:underline",
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
  return <section className={`rounded-panel p-5 shadow-[var(--shadow-soft)] ${tone ? tones[tone] : "bg-card"} ${className}`}>{children}</section>;
}

/** Round, soft icon button (header actions, scanner controls). */
export function IconButton({ label, className = "", children, ...p }: ComponentProps<"button"> & { label: string }) {
  return (
    <button aria-label={label} className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-raised/90 text-ink shadow-[var(--shadow-soft)] hover:brightness-105 ${className}`} {...p}>
      {children}
    </button>
  );
}

export function IconLink({ label, className = "", children, ...p }: ComponentProps<typeof Link> & { label: string }) {
  return (
    <Link aria-label={label} className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-raised/90 text-ink shadow-[var(--shadow-soft)] hover:brightness-105 ${className}`} {...p}>
      {children}
    </Link>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-dashed border-muted/70 bg-raised/60 px-2.5 py-0.5 text-xs font-medium text-muted" title="Seeded example data, not a real measurement">
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

export const inputClass = "w-full rounded-2xl border border-line/70 bg-raised px-4 py-3 text-base outline-none placeholder:text-muted/70 focus:border-forest";

const CHIP_TONES = {
  neutral: "bg-raised text-ink",
  muted: "bg-raised/70 text-muted",
  good: "bg-good-soft text-good",
  stop: "bg-stop-soft text-stop",
  treated: "bg-treated-soft text-treated",
  control: "bg-control-soft text-control",
};

export function Chip({ tone = "neutral", className = "", children }: { tone?: keyof typeof CHIP_TONES; className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${CHIP_TONES[tone]} ${className}`}>{children}</span>;
}

/** Pill segmented control (radio semantics). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-soft)]">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={`min-h-10 rounded-full px-3 text-sm transition-colors ${value === o.value ? "bg-forest text-white" : "text-ink hover:bg-raised"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
