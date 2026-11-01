import type { ReactNode } from "react";

/**
 * The face-scanner oval: content clipped to a tall capsule, wrapped in a ring of fine ticks,
 * with an optional floating status chip. Used by the live camera and the scan hub.
 */
export function ScannerFrame({ children, status, live = false }: { children: ReactNode; status?: ReactNode; live?: boolean }) {
  const ticks = 120;
  return (
    <div className="relative mx-auto w-full max-w-[19rem]" style={{ aspectRatio: "3 / 4.1" }}>
      <svg viewBox="0 0 300 410" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {Array.from({ length: ticks }, (_, i) => {
          // Points on a capsule (stadium) outline: two semicircles joined by straight sides.
          const t = (i / ticks) * 2 * Math.PI;
          const rx = 146;
          const ry = 200;
          const x = 150 + rx * Math.sin(t);
          const y = 205 - ry * Math.cos(t);
          const nx = Math.sin(t);
          const ny = -Math.cos(t);
          return <line key={i} x1={x.toFixed(2)} y1={y.toFixed(2)} x2={(x - nx * 7).toFixed(2)} y2={(y - ny * 7).toFixed(2)} stroke="var(--color-forest)" strokeOpacity={live ? 0.8 : 0.45} strokeWidth="1.4" />;
        })}
      </svg>
      <div className="absolute inset-[14px] overflow-hidden rounded-[999px] bg-forest/80">{children}</div>
      {status && (
        <div className="absolute left-1/2 top-[12%] max-w-[85%] -translate-x-1/2 rounded-2xl bg-forest-deep/85 px-4 py-2 text-center text-sm text-white shadow-[var(--shadow-float)] backdrop-blur" role="status" aria-live="polite">
          {status}
        </div>
      )}
    </div>
  );
}

/** Line-art face used where there is no photo (scan hub, demo). */
export function FaceLineArt() {
  return (
    <svg viewBox="0 0 200 270" className="h-full w-full" aria-hidden="true">
      <rect width="200" height="270" fill="#6f8b6d" />
      <g fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round">
        <path d="M100 40c-38 0-58 30-58 72 0 50 28 98 58 98s58-48 58-98c0-42-20-72-58-72z" strokeOpacity="0.55" />
        <path d="M100 40v170" strokeDasharray="4 5" />
        <path d="M68 104c8-6 18-6 24 0M108 104c6-6 16-6 24 0" />
        <path d="M100 118v26c0 5-4 8-10 8" strokeOpacity="0.7" />
        <path d="M84 176c10 6 22 6 32 0" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${56 + i * 6} ${136 + i * 4}q14 -4 26 6`} strokeOpacity="0.45" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={`r${i}`} d={`M${144 - i * 6} ${136 + i * 4}q-14 -4 -26 6`} strokeOpacity="0.45" />
        ))}
      </g>
      <ellipse cx="72" cy="150" rx="20" ry="16" fill="var(--color-treated)" opacity="0.35" />
      <ellipse cx="128" cy="150" rx="20" ry="16" fill="var(--color-control)" opacity="0.35" />
    </svg>
  );
}
