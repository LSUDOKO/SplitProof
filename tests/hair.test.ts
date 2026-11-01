import { describe, expect, it } from "vitest";
import { judgeHair, type FrizzLevel, type HairTrial } from "@/lib/hair/model";

const check = (day: number, treated: FrizzLevel, control: FrizzLevel) => ({ at: `2026-11-${String(1 + day).padStart(2, "0")}T08:00:00Z`, day, isBaseline: day === 0, treated, control });
const trial = (checks: ReturnType<typeof check>[]): HairTrial => ({ id: "h", product: "Serum", treatedSide: "left", createdAt: "", plannedDays: 14, checks, isDemo: false });

describe("SplitHair verdict", () => {
  it("needs a baseline, then two follow-ups", () => {
    expect(judgeHair(trial([])).verdict).toBe("baseline_needed");
    expect(judgeHair(trial([check(0, 2, 2), check(3, 1, 2)])).verdict).toBe("too_early");
  });
  it("calls less frizz only when a full level holds on two check-ins", () => {
    expect(judgeHair(trial([check(0, 2, 2), check(3, 1, 2), check(6, 1, 2)])).verdict).toBe("less_frizz");
    expect(judgeHair(trial([check(0, 2, 2), check(3, 1, 2), check(6, 2, 2)])).verdict).toBe("keep_going");
  });
  it("subtracts a natural side difference seen at baseline", () => {
    // Treated side was already one level frizzier at baseline; equal later = an improvement of one level.
    expect(judgeHair(trial([check(0, 2, 1), check(3, 1, 1), check(6, 1, 1)])).verdict).toBe("less_frizz");
  });
  it("flags more frizz and keeps confidence low unless the gap is two levels", () => {
    const r = judgeHair(trial([check(0, 1, 1), check(3, 2, 1), check(6, 2, 1)]));
    expect(r).toMatchObject({ verdict: "more_frizz", confidence: "Low" });
    expect(judgeHair(trial([check(0, 2, 2), check(3, 0, 2), check(6, 0, 2)])).confidence).toBe("Medium");
  });
  it("ends with no clear difference at the planned day", () => {
    expect(judgeHair(trial([check(0, 2, 2), check(7, 2, 2), check(14, 2, 2)])).verdict).toBe("no_clear_difference");
  });
});

describe("demo hair trial", () => {
  it("shows less frizz on the treated side", async () => {
    const { demoHairTrial } = await import("@/lib/demo/hair");
    const t = demoHairTrial("2026-11-01T08:00:00Z");
    expect(t.isDemo).toBe(true);
    expect(judgeHair(t).verdict).toBe("less_frizz");
  });
});

describe("frizz API error mapping", () => {
  it("turns the recorded angle error into guidance", async () => {
    const { readFileSync } = await import("node:fs");
    const { extractErrorCode, friendlyMessage } = await import("@/lib/youcam/errors");
    const raw = JSON.parse(readFileSync("tests/fixtures/youcam/frizz-error/task-result.json", "utf8"));
    const code = extractErrorCode(raw.data);
    expect(code).toBe("error_face_angle_invalid");
    expect(friendlyMessage(code)).toContain("Side photos");
  });
});
