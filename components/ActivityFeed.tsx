import type { AgentEvent } from "@/lib/types";

const DOT: Partial<Record<AgentEvent["kind"], string>> = {
  sentinel_stop: "bg-stop",
  sentinel_watch: "bg-control",
  verdict: "bg-good",
  early_stop: "bg-good",
  deadline_warning: "bg-stop",
};

export function ActivityFeed({ events }: { events: AgentEvent[] }) {
  if (!events.length) return <p className="text-sm text-ink/70">The assistant will log what it decides here: scan schedule, alerts and verdicts.</p>;
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[0.3rem] before:top-2 before:w-px before:bg-line">
      {events.map((e) => (
        <li key={e.id} className="relative grid grid-cols-[0.75rem_1fr] gap-3">
          <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${DOT[e.kind] ?? "bg-treated"}`} aria-hidden="true" />
          <div className="min-w-0">
            <time className="text-xs text-ink/70" dateTime={e.at}>
              {new Date(e.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </time>
            <p className="text-sm">{e.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
