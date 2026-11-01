import type { AgentSummary } from "./summary";

export type DraftKind = "return_request" | "brand_feedback" | "share_summary";

/** Deterministic message drafts; the agent hands these to the user, it never sends anything. */
export function draftMessage(s: AgentSummary, kind: DraftKind, tone: "polite" | "firm" = "polite"): string {
  const t = s.trial;
  const outcome =
    s.verdict.verdict === "stop" || s.verdict.verdict === "worse"
      ? "caused redness or breakouts on the tested side"
      : s.verdict.verdict === "working"
        ? "showed a measurable improvement"
        : "showed no measurable difference";
  if (kind === "return_request") {
    const ask = tone === "firm" ? "Please confirm the return and refund within 3 working days." : "Please let me know how to proceed.";
    return [
      `Subject: Return request — ${t.product}`,
      "",
      "Hello,",
      `I'd like to return ${t.product}. I tested it on one side of my face for ${t.daysElapsed} days and it ${outcome} compared with the untreated side.`,
      t.returnDeadline ? `I'm within your return window (deadline ${t.returnDeadline}).` : "",
      ask,
      "",
      "Thank you,",
      "[Your name]",
    ]
      .filter((l, i, a) => l !== "" || a[i - 1] !== "")
      .join("\n");
  }
  if (kind === "brand_feedback")
    return `Hello,\nI ran an at-home split-face trial of ${t.product} for ${t.daysElapsed} days (product on one cheek, the other as control). Result: ${s.verdict.sentence}\nI thought this could be useful feedback.\n[Your name]`;
  return `My SplitSide trial of ${t.product}: ${s.verdict.sentence} (${t.daysElapsed} days, one cheek treated, the other as control.)`;
}
