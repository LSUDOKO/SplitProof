"use client";
import { useEffect, useState } from "react";
import { media as mediaRepo } from "@/lib/db";
import type { Scan, ScanMedia, Side } from "@/lib/types";
import { SplitPhoto } from "./SplitPhoto";

/** Day-0 vs latest scan, side by side in time (each photo is itself split treated / control). */
export function ScanCompare({ scans, treatedSide }: { trialId: string; scans: Scan[]; treatedSide: Side }) {
  const first = scans.find((s) => s.isBaseline);
  const last = [...scans].reverse().find((s) => !s.isBaseline);
  const [pair, setPair] = useState<(ScanMedia | undefined)[]>([]);
  const [which, setWhich] = useState(1);
  useEffect(() => {
    Promise.all([first, last].map((s) => (s ? mediaRepo.get(s.id) : undefined))).then(setPair);
  }, [first, last]);
  const shown = pair[which] ?? pair[0];
  const scan = which === 1 && pair[1] ? last : first;
  if (!shown || !scan) return <p className="text-sm text-muted">Photos for this trial aren&apos;t stored on this device.</p>;
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 rounded-full border border-line p-1 text-sm font-medium" role="tablist">
        {["Day 0", `Day ${last?.dayIndex ?? "–"}`].map((label, i) => (
          <button key={label} role="tab" aria-selected={which === i} onClick={() => setWhich(i)} className={`min-h-9 rounded-full ${which === i ? "bg-ink text-white" : ""}`}>
            {label}
          </button>
        ))}
      </div>
      <SplitPhoto media={shown} treatedSide={treatedSide} width={scan.meta.width} height={scan.meta.height} />
    </div>
  );
}
