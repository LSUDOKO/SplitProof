import { events, scans, trials } from "../db";
import { DEMO_TRIAL_IDS, buildDemo } from "./seed";

/** Idempotent: replaces any existing demo trials with a fresh copy dated relative to today. */
export async function loadDemo() {
  for (const id of DEMO_TRIAL_IDS) await trials.remove(id);
  const demo = buildDemo();
  for (const t of demo.trials) await trials.put(t);
  for (const s of demo.scans) await scans.put(s);
  for (const e of demo.events) await events.add(e);
}
