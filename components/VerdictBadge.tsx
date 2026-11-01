import { VERDICT_TITLES } from "@/lib/trial/explain";
import type { Verdict } from "@/lib/types";

const TONE: Record<Verdict, string> = {
  working: "bg-good-soft text-good",
  stop: "bg-stop-soft text-stop",
  worse: "bg-stop-soft text-stop",
  no_difference: "bg-paper text-ink border border-line",
  keep_going: "bg-treated-soft text-treated",
  insufficient_data: "bg-paper text-muted border border-line",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${TONE[verdict]}`}>{VERDICT_TITLES[verdict]}</span>;
}
