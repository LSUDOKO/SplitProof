"use client";
import { useCallback, useEffect, useState } from "react";
import { events as eventsRepo, scans as scansRepo, trials as trialsRepo } from "./db";
import { evaluateTrial, type TrialVerdict } from "./stats/verdict";
import type { AgentEvent, Scan, Trial } from "./types";

export interface TrialData {
  trial: Trial;
  scans: Scan[];
  events: AgentEvent[];
  verdict: TrialVerdict;
}

/** Loads one trial from IndexedDB and runs the deterministic engine over it. */
export function useTrial(id: string) {
  const [data, setData] = useState<TrialData | null | undefined>(undefined);
  const reload = useCallback(async () => {
    const trial = await trialsRepo.get(id);
    if (!trial) return setData(null);
    const [scans, events] = await Promise.all([scansRepo.forTrial(id), eventsRepo.forTrial(id)]);
    setData({ trial, scans, events, verdict: evaluateTrial(trial, scans) });
  }, [id]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, reload };
}

export function useAllTrials() {
  const [list, setList] = useState<TrialData[] | undefined>(undefined);
  const reload = useCallback(async () => {
    const all = await trialsRepo.all();
    setList(
      await Promise.all(
        all.map(async (trial) => {
          const scans = await scansRepo.forTrial(trial.id);
          return { trial, scans, events: [], verdict: evaluateTrial(trial, scans) };
        }),
      ),
    );
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { list, reload };
}
