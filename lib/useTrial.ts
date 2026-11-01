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

async function loadTrial(id: string): Promise<TrialData | null> {
  const trial = await trialsRepo.get(id);
  if (!trial) return null;
  const [scans, events] = await Promise.all([scansRepo.forTrial(id), eventsRepo.forTrial(id)]);
  return { trial, scans, events, verdict: evaluateTrial(trial, scans) };
}

async function loadAll(): Promise<TrialData[]> {
  const all = await trialsRepo.all();
  return Promise.all(
    all.map(async (trial) => {
      const scans = await scansRepo.forTrial(trial.id);
      return { trial, scans, events: [], verdict: evaluateTrial(trial, scans) };
    }),
  );
}

/** Loads one trial from IndexedDB and runs the deterministic engine over it. undefined = loading, null = not found. */
export function useTrial(id: string) {
  const [data, setData] = useState<TrialData | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadTrial(id).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [id]);
  const reload = useCallback(() => loadTrial(id).then(setData), [id]);
  return { data, reload };
}

export function useAllTrials() {
  const [list, setList] = useState<TrialData[] | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadAll().then((d) => alive && setList(d));
    return () => {
      alive = false;
    };
  }, []);
  return { list };
}
