"use client";
import { useEffect, useState } from "react";
import { media as mediaRepo } from "@/lib/db";
import type { Scan, ScanMedia, Side } from "@/lib/types";
import { SplitPhoto } from "./SplitPhoto";
import { Segmented } from "./ui";

/** Day-0 vs latest scan, side by side in time (each photo is itself split treated / control). */
export function ScanCompare({ scans, treatedSide }: { scans: Scan[]; treatedSide: Side }) {
  const first = scans.find((s) => s.isBaseline);
  const last = [...scans].reverse().find((s) => !s.isBaseline);
  const [pair, setPair] = useState<(ScanMedia | undefined)[]>([]);
  const [which, setWhich] = useState<"before" | "latest">("latest");
  useEffect(() => {
    Promise.all([first, last].map((s) => (s ? mediaRepo.get(s.id) : undefined))).then(setPair);
  }, [first, last]);
  const showLatest = which === "latest" && !!pair[1];
  const shown = showLatest ? pair[1] : pair[0];
  const scan = showLatest ? last : first;
  if (!shown || !scan) return <p className="text-sm text-ink/70">Photos for this trial aren&apos;t stored on this device.</p>;
  return (
    <div>
      <div className="mb-3">
        <Segmented
          label="Scan to show"
          value={which}
          options={[
            { value: "before", label: "Day 0" },
            { value: "latest", label: `Day ${last?.dayIndex ?? "–"}` },
          ]}
          onChange={setWhich}
        />
      </div>
      <SplitPhoto media={shown} treatedSide={treatedSide} width={scan.meta.width} height={scan.meta.height} />
    </div>
  );
}
