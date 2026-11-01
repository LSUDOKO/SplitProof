import { CalendarClock } from "lucide-react";
import { daysUntil } from "@/lib/trial/plan";

export function DeadlineChip({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const d = daysUntil(deadline);
  const date = new Date(deadline).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const urgent = d <= 3;
  const left = d === 0 ? "today" : `${d} day${d === 1 ? "" : "s"}`;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-ink ${urgent ? "bg-stop-soft" : "bg-raised"}`}>
      <CalendarClock size={14} aria-hidden="true" className={urgent ? "text-stop" : "text-ink/70"} />
      {d < 0 ? `Return window closed ${date}` : `Return by ${date} · ${left}`}
    </span>
  );
}
