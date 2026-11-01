import type { ReactNode } from "react";
import type { Side } from "@/lib/types";

const SPOTS = {
  cheeks: { cy: 146, rx: 24, ry: 20 },
  under_eyes: { cy: 128, rx: 20, ry: 8 },
};

/** Side colour as a dot beside ink text, so the label keeps full contrast in both themes. */
export function SideChip({ kind, children }: { kind: "treated" | "control"; children: ReactNode }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-2xl px-3 py-1 text-sm text-ink [overflow-wrap:anywhere] ${kind === "treated" ? "bg-treated-soft" : "bg-control-soft"}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${kind === "treated" ? "bg-treated" : "bg-control"}`} aria-hidden="true" />
      {children}
    </span>
  );
}

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
  highlight?: keyof typeof SPOTS | "none";
}) {
  const leftIsTreated = treatedSide !== "right";
  const leftColor = leftIsTreated ? "var(--color-treated)" : "var(--color-control)";
  const rightColor = leftIsTreated ? "var(--color-control)" : "var(--color-treated)";
  const leftText = treatedSide ? (leftIsTreated ? treatedLabel : controlLabel) : "Product";
  const rightText = treatedSide ? (leftIsTreated ? controlLabel : treatedLabel) : "Control";
  const spot = highlight === "none" ? null : SPOTS[highlight];
  return (
    <figure className="flex flex-col items-center" aria-label={treatedSide ? `Product goes on your ${treatedSide} side` : "A face split at the midline"}>
      <svg viewBox="0 0 200 240" width={size} height={(size * 240) / 200} aria-hidden="true">
        <defs>
          <clipPath id="sf-head">
            <path d="M100 14c-48 0-74 38-74 92 0 62 34 120 74 120s74-58 74-120c0-54-26-92-74-92z" />
          </clipPath>
        </defs>
        <g clipPath="url(#sf-head)">
          <rect x="0" y="0" width="200" height="240" fill="var(--color-raised)" />
          <rect x="0" y="0" width="100" height="240" fill={leftColor} opacity="0.18" />
          <rect x="100" y="0" width="100" height="240" fill={rightColor} opacity="0.18" />
          {spot && (
            <>
              <ellipse data-cheek={leftIsTreated ? "treated" : "control"} cx="62" {...spot} fill={leftColor} opacity="0.55" />
              <ellipse data-cheek={leftIsTreated ? "control" : "treated"} cx="138" {...spot} fill={rightColor} opacity="0.55" />
            </>
          )}
        </g>
        <path d="M100 14c-48 0-74 38-74 92 0 62 34 120 74 120s74-58 74-120c0-54-26-92-74-92z" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        <g stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M52 98c8-6 22-6 30 0M118 98c8-6 22-6 30 0" />
          <path d="M58 116c6 4 16 4 22 0M120 116c6 4 16 4 22 0" />
          <path d="M100 118v32c0 6-5 9-12 9" />
          <path d="M80 186c12 7 28 7 40 0" />
        </g>
        <line x1="100" y1="2" x2="100" y2="238" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="5 5" />
      </svg>
      {labels && (
        <figcaption className="mt-2 grid w-full grid-cols-2 gap-2 text-center text-sm" style={{ maxWidth: Math.max(size, 240) }}>
          <FaceLabel color={leftColor} text={leftText} side="your left" />
          <FaceLabel color={rightColor} text={rightText} side="your right" />
        </figcaption>
      )}
    </figure>
  );
}

function FaceLabel({ color, text, side }: { color: string; text: string; side: string }) {
  return (
    <span className="min-w-0 break-words">
      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {text}
      <span className="block text-xs text-ink/70">{side}</span>
    </span>
  );
}
