import { useId } from "react";

export type ProductKind = "jar" | "tube" | "pump";

/** Pick a stable shape from the product name, honouring obvious words ("serum" → pump, "cream" → jar). */
export function kindFor(name: string): ProductKind {
  const n = name.toLowerCase();
  if (/serum|toner|essence|oil|wash|cleanser|lotion/.test(n)) return "pump";
  if (/gel|sunscreen|spf|foundation|concealer/.test(n)) return "tube";
  if (/cream|moistur|balm|mask/.test(n)) return "jar";
  return (["jar", "tube", "pump"] as const)[[...n].reduce((s, c) => s + c.charCodeAt(0), 0) % 3];
}

/**
 * Unbranded product illustration in the app's greens (never a real brand or trademark).
 * Decorative: always pair it with the product name in text.
 */
export function ProductArt({ kind, name, size = 96, className = "" }: { kind?: ProductKind; name?: string; size?: number; className?: string }) {
  const id = useId();
  const k = kind ?? kindFor(name ?? "");
  const body = `${id}-b`;
  const cap = `${id}-c`;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2f6b34" />
          <stop offset="0.35" stopColor="#6fae6a" />
          <stop offset="0.7" stopColor="#3f8043" />
          <stop offset="1" stopColor="#265a2b" />
        </linearGradient>
        <linearGradient id={cap} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#c9d2c8" />
          <stop offset="0.4" stopColor="#f6f8f4" />
          <stop offset="1" stopColor="#aab6a9" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="#1d3a1f" opacity="0.18" />
      {k === "jar" && (
        <>
          <path d="M28 38c4-14 18-20 32-20s28 6 32 20z" fill={`url(#${cap})`} />
          <path d="M42 26c8 5 22 6 34 1" stroke="#b9c4b8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="26" y="36" width="68" height="9" rx="3" fill="#7fb07a" />
          <rect x="30" y="42" width="60" height="5" fill="#2f6b34" />
          <path d="M22 50c0-3 2-5 5-5h66c3 0 5 2 5 5v40c0 9-7 16-16 16H38c-9 0-16-7-16-16z" fill={`url(#${body})`} />
          <path d="M30 54v34" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {k === "tube" && (
        <>
          <path d="M36 12h48l-6 74H42z" fill={`url(#${body})`} />
          <rect x="33" y="8" width="54" height="7" rx="2" fill="#2f6b34" />
          <path d="M44 22l3 56" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
          <rect x="42" y="86" width="36" height="20" rx="3" fill={`url(#${cap})`} />
        </>
      )}
      {k === "pump" && (
        <>
          <path d="M52 10h26c2 0 3 2 2 4l-3 5H50z" fill={`url(#${cap})`} />
          <rect x="55" y="18" width="12" height="14" fill={`url(#${cap})`} />
          <rect x="48" y="30" width="26" height="9" rx="2" fill={`url(#${cap})`} />
          <path d="M34 50c0-7 6-12 12-12h30c6 0 12 5 12 12v46c0 6-5 10-10 10H44c-5 0-10-4-10-10z" fill={`url(#${body})`} />
          <path d="M42 50v42" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
