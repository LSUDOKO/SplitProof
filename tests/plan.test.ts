import { describe, expect, it } from "vitest";
import { naturalAsymmetry } from "@/lib/stats/asymmetryReport";
import { checkPlan, nextScanDay, plannedDaysFor, randomSide, scanSchedule } from "@/lib/trial/plan";
import { makeScan } from "./helpers/trial";

describe("trial planning", () => {
  it("uses the slowest goal for duration", () => {
    expect(plannedDaysFor(["hd_moisture"])).toBe(7);
    expect(plannedDaysFor(["hd_moisture", "hd_pore"])).toBe(28);
  });
  it("warns when the trial ends after the return deadline", () => {
    const p = checkPlan(["hd_acne"], "2026-11-01T00:00:00Z", "2026-11-10T00:00:00Z");
    expect(p.fitsDeadline).toBe(false);
    expect(checkPlan(["hd_moisture"], "2026-11-01T00:00:00Z", "2026-11-10T00:00:00Z").fitsDeadline).toBe(true);
  });
  it("lets the makeup wear test fix the length at 7 days", () => {
    expect(checkPlan(["hd_acne", "hd_oiliness"], "2026-11-01T00:00:00Z", "2026-11-10T00:00:00Z", 7)).toMatchObject({ plannedDays: 7, fitsDeadline: true });
  });
  it("schedules scans every two days ending on the planned day", () => {
    expect(scanSchedule(7)).toEqual([2, 4, 6, 7]);
    expect(nextScanDay(7, [0, 0, 0, 2])).toBe(4);
  });
  it("randomises sides", () => {
    expect(randomSide(() => 0.1)).toBe("left");
    expect(randomSide(() => 0.9)).toBe("right");
  });
  it("reports clear natural asymmetry at baseline only", () => {
    const scans = [0, 1, 2].map(() => makeScan(0, { hd_age_spot: 0.4, hd_acne: 0.05 }));
    const notes = naturalAsymmetry(scans);
    expect(notes).toEqual([{ concern: "hd_age_spot", side: "left", pct: 49 }]);
  });
});
