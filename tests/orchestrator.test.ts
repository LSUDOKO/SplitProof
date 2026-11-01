import { describe, expect, it } from "vitest";
import { evaluateTrial } from "@/lib/stats/verdict";
import { afterScan } from "@/lib/trial/orchestrator";
import { baseline, makeScan, makeTrial } from "./helpers/trial";

describe("trial orchestrator", () => {
  it("activates the trial after three baseline scans", () => {
    const t = makeTrial({ status: "baseline" });
    const scans = baseline("hd_acne");
    const out = afterScan(t, scans, evaluateTrial(t, scans));
    expect(out.trial.status).toBe("active");
  });
  it("stops the trial and mentions the return draft on a sentinel stop", () => {
    const t = makeTrial({ goals: ["hd_redness"], returnDeadline: "2026-11-20T00:00:00Z" });
    const scans = [...baseline("hd_redness", 0), makeScan(2, { hd_redness: 0.3 })];
    const out = afterScan(t, scans, evaluateTrial(t, scans), "2026-11-03T00:00:00Z");
    expect(out.trial.status).toBe("stopped");
    expect(out.events[0].kind).toBe("sentinel_stop");
    expect(out.events[0].text).toContain("return draft");
  });
  it("finishes early on a clear effect", () => {
    const t = makeTrial();
    const scans = [...baseline("hd_acne"), makeScan(7, { hd_acne: -0.25 }), makeScan(9, { hd_acne: -0.3 })];
    const out = afterScan(t, scans, evaluateTrial(t, scans));
    expect(out.trial.status).toBe("finished");
    expect(out.events[0].kind).toBe("early_stop");
  });
  it("extends a borderline trial", () => {
    const t = makeTrial({ returnDeadline: "2026-12-10T00:00:00Z" });
    const scans = [...baseline("hd_acne"), makeScan(13, { hd_acne: 0 }), makeScan(15, { hd_acne: 0 })];
    const out = afterScan(t, scans, evaluateTrial(t, scans, "2026-11-16T00:00:00Z"), "2026-11-16T00:00:00Z");
    expect(out.trial.extendedDays).toBe(7);
  });
});
