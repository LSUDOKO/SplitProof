import type { Side } from "@/lib/types";

/**
 * The signature visual: a face split at the midline, drawn as the user sees themself in a
 * mirror (their left cheek on the screen's left). The treated half is tinted blue, the control amber.
 */
export function SplitFace({
  treatedSide,
  size = 220,
  labels = true,
  treatedLabel = "Treated",
  controlLabel = "Control",
  highlight = "cheeks",
}: {
  treatedSide?: Side;
  size?: number;
  labels?: boolean;
  treatedLabel?: string;
  controlLabel?: string;
  highlight?: "cheeks" | "none";
}) {
  const leftIsTreated = treatedSide !== "right";
  const leftColor = treatedSide ? (leftIsTreated ? "var(--color-treated)" : "var(--color-control)") : "var(--color-treated)";
  const rightColor = treatedSide ? (leftIsTreated ? "var(--color-control)" : "var(--color-treated)") : "var(--color-control)";
  const leftText = leftIsTreated ? treatedLabel : controlLabel;
  const rightText = leftIsTreated ? controlLabel : treatedLabel;
  return (
    <figure className="flex flex-col items-center" aria-label={treatedSide ? `Product goes on your ${treatedSide} cheek` : "A face split at the midline"}>
      <svg viewBox="0 0 200 240" width={size} height={(size * 240) / 200} role="img" aria-hidden="true">
        <defs>
          <clipPath id="sf-head">
            <path d="M100 14c-48 0-74 38-74 92 0 62 34 120 74 120s74-58 74-120c0-54-26-92-74-92z" />
          </clipPath>
        </defs>
        <g clipPath="url(#sf-head)">
          <rect x="0" y="0" width="100" height="240" fill={leftColor} opacity="0.16" />
          <rect x="100" y="0" width="100" height="240" fill={rightColor} opacity="0.16" />
          {highlight === "cheeks" && (
            <>
              <ellipse cx="62" cy="146" rx="24" ry="20" fill={leftColor} opacity="0.45" />
              <ellipse cx="138" cy="146" rx="24" ry="20" fill={rightColor} opacity="0.45" />
            </>
          )}
        </g>
        <path d="M100 14c-48 0-74 38-74 92 0 62 34 120 74 120s74-58 74-120c0-54-26-92-74-92z" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
        <g stroke="var(--color-ink)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M52 98c8-6 22-6 30 0M118 98c8-6 22-6 30 0" />
          <path d="M58 116c6 4 16 4 22 0M120 116c6 4 16 4 22 0" />
          <path d="M100 118v32c0 6-5 9-12 9" />
          <path d="M80 186c12 7 28 7 40 0" />
        </g>
        <line x1="100" y1="2" x2="100" y2="238" stroke="var(--color-ink)" strokeWidth="2" strokeDasharray="5 5" />
      </svg>
      {labels && (
        <figcaption className="mt-2 grid w-full grid-cols-2 text-center text-sm font-medium" style={{ maxWidth: size }}>
          <span style={{ color: leftColor }}>
            {treatedSide ? leftText : "Product"}
            <span className="block text-xs font-normal text-muted">your left</span>
          </span>
          <span style={{ color: rightColor }}>
            {treatedSide ? rightText : "Control"}
            <span className="block text-xs font-normal text-muted">your right</span>
          </span>
        </figcaption>
      )}
    </figure>
  );
}
