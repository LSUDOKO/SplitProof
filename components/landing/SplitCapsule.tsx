import { useId, type ReactNode } from "react";
import { ProductArt } from "@/components/ProductArt";
import { CAPSULE, TICK_DASH, TICKS } from "./ScanFace";

/** The logo blown up into the scanner shape: treated tone, control tone, dashed midline. */
export function SplitCapsule({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`relative aspect-[400/548] ${className}`}>
      <svg viewBox="0 0 400 548" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <clipPath id={id}>
            <path d={CAPSULE} />
          </clipPath>
        </defs>
        <path d={TICKS} fill="none" stroke="var(--color-forest)" strokeOpacity="0.55" strokeWidth="7" strokeDasharray={TICK_DASH} />
        <g clipPath={`url(#${id})`}>
          <rect data-half x="18" width="182" height="548" fill="var(--color-treated-soft)" />
          <rect data-half x="200" width="182" height="548" fill="var(--color-control-soft)" />
        </g>
        <path data-midline d="M200 38V510" stroke="var(--color-ink)" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="5 6" />
      </svg>
      {children}
    </div>
  );
}

/** ProductArt's jar with extra studio light on top: a cream swirl, a soft rim, side reflections. */
export function GlossyJar({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <ProductArt kind="jar" size={360} className="h-auto w-full" />
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-rim`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-base`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0d2c11" stopOpacity="0" />
            <stop offset="1" stopColor="#0d2c11" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <path d="M22 74v16c0 9 7 16 16 16h44c9 0 16-7 16-16V74z" fill={`url(#${id}-base)`} />
        <path d="M27 46h66c3 0 5 2 5 5v3H22v-3c0-3 2-5 5-5z" fill={`url(#${id}-rim)`} />
        <path d="M29 53c-1 12-1 24 0 36 1 4 3 8 7 9-3-14-3-30-1-45z" fill="white" fillOpacity="0.36" filter={`url(#${id}-soft)`} />
        <ellipse cx="84" cy="72" rx="2" ry="15" fill="white" fillOpacity="0.24" filter={`url(#${id}-soft)`} />
        <path d="M26 40.5h68" stroke="white" strokeOpacity="0.45" strokeWidth="0.8" />
        <g fill="none" stroke="#9fae9e" strokeLinecap="round">
          <path d="M31 36c6-5 13-5 19-3 8 3 17 2 24-3" strokeOpacity="0.65" strokeWidth="1.3" />
          <path d="M38 28c6-5 12-6 18-4 6 2 11 1 15-2" strokeOpacity="0.55" strokeWidth="1.1" />
          <path d="M49 21c3-1.8 7-2 10-1" strokeOpacity="0.5" />
        </g>
        <path d="M34 34c5-9 14-13 23-14-7 4-14 9-19 15z" fill="white" fillOpacity="0.8" filter={`url(#${id}-soft)`} />
      </svg>
    </div>
  );
}
