import { daysUntil } from "@/lib/trial/plan";

export function DeadlineChip({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const d = daysUntil(deadline);
  const date = new Date(deadline).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const urgent = d <= 3;
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${urgent ? "bg-stop-soft text-stop" : "bg-paper text-ink border border-line"}`}>
      {d < 0 ? `Return window closed ${date}` : `Return by ${date} · ${d} day${d === 1 ? "" : "s"}`}
    </span>
  );
}
