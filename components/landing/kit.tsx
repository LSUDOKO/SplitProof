import { ArrowRight, Check, Minus, OctagonX } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui";
import { VERDICT_TITLES } from "@/lib/trial/explain";

export const H2 = "text-[2rem] font-light leading-[1.1] tracking-[-0.02em] text-balance sm:text-[2.6rem] lg:text-5xl";
export const LEDE = "mt-4 max-w-[54ch] text-lg text-ink/80 text-pretty";
export const SECTION = "mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-28";

const TONES = {
  neutral: "bg-raised",
  treated: "bg-treated-soft",
  control: "bg-control-soft",
  good: "bg-good-soft",
  // Earthy tones with no meaning attached, for chips that must not read as treated, control or a verdict.
  clay: "bg-[color-mix(in_srgb,var(--color-stop-soft)_55%,var(--color-control-soft))]",
  stone: "bg-line",
  moss: "bg-[color-mix(in_srgb,var(--color-good-soft)_50%,var(--color-line))]",
};

/**
 * Earthy tag. Text stays ink on every tone: treated, control and good coloured text falls under
 * 4.5:1 on their soft backgrounds in the light theme, so colour comes from the fill and the dot.
 */
export function Tag({ tone = "neutral", dot, small = false, children }: { tone?: keyof typeof TONES; dot?: "treated" | "control"; small?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-ink shadow-[var(--shadow-soft)] ${small ? "px-2.5 py-1 text-[0.8rem]" : "px-3 py-1.5 text-sm"} ${TONES[tone]}`}>
      {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot === "treated" ? "bg-treated" : "bg-control"}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** The primary call to action: a dark-green pill with a round knob. */
export function StartLink({ variant, className = "" }: { variant?: "primary" | "secondary"; className?: string }) {
  return (
    <ButtonLink href="/welcome" variant={variant} className={`pr-2 ${className}`}>
      Start a trial
      <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-night text-white">
        <ArrowRight size={18} aria-hidden="true" />
      </span>
    </ButtonLink>
  );
}

const VERDICTS = [
  { title: VERDICT_TITLES.working, tone: "bg-good-soft", icon: Check },
  { title: VERDICT_TITLES.no_difference, tone: "bg-raised", icon: Minus },
  { title: VERDICT_TITLES.stop, tone: "bg-stop-soft", icon: OctagonX },
];

/** The answers a trial can end on, using the same titles as the verdict screen. */
export function VerdictPills({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {VERDICTS.map(({ title, tone, icon: Icon }) => (
        <li key={title} data-pill className={`flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm text-ink shadow-[var(--shadow-soft)] ${tone}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card/70">
            <Icon size={15} aria-hidden="true" />
          </span>
          {title}
        </li>
      ))}
    </ul>
  );
}
