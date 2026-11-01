import { describe, expect, it } from "vitest";
import { baselineOf, effectPercent, theilSen } from "@/lib/stats/series";
import { confidenceOf, evaluateTrial } from "@/lib/stats/verdict";
import { baseline, makeScan, makeTrial } from "./helpers/trial";

const A0 = 0.1;
const acne = (day: number, delta: number, over = {}) => makeScan(day, { hd_acne: A0 + delta }, over);

describe("baseline", () => {
  it("floors sd at 0.05, giving SDC ≈ 0.139", () => {
    const b = baselineOf([0.1, 0.11, 0.09]);
    expect(b.sd).toBe(0.05);
    expect(b.sdc).toBeCloseTo(0.1386, 3);
    expect(b.a0).toBeCloseTo(0.1, 6);
  });
  it("uses the real sd when it exceeds the floor", () => {
    expect(baselineOf([0, 0.2, 0.4]).sd).toBeCloseTo(0.2, 6);
  });
});

describe("verdict", () => {
  it("is insufficient with fewer than two follow-up scans", () => {
    expect(evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(8, -0.4)]).verdict).toBe("insufficient_data");
  });

  it("is insufficient before the goal's minimum days", () => {
    expect(evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(2, -0.4), acne(4, -0.4)]).verdict).toBe("insufficient_data");
  });

  it("returns WORKING when Δ stays below −SDC", () => {
    const v = evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(5, -0.1), acne(9, -0.18), acne(11, -0.2)]);
    expect(v.verdict).toBe("working");
    expect(v.concerns[0].effectPct).toBeGreaterThan(15);
    expect(v.final).toBe(false);
  });

  it("ends early when Δ ≤ −1.5·SDC on two scans", () => {
    const v = evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(7, -0.3), acne(9, -0.35)]);
    expect(v.verdict).toBe("working");
    expect(v.final).toBe(true);
    expect(v.concerns[0].early).toBe(true);
  });

  it("returns WORSE when Δ stays above +SDC (non-sentinel concern)", () => {
    const oil = (day: number, d: number) => makeScan(day, { hd_oiliness: A0 + d });
    const v = evaluateTrial(makeTrial({ goals: ["hd_oiliness"], plannedDays: 7 }), [...baseline("hd_oiliness"), oil(3, 0.18), oil(5, 0.2)]);
    expect(v.verdict).toBe("worse");
  });

  it("lets a rising acne goal trip the sentinel (STOP beats WORSE)", () => {
    expect(evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(8, 0.18), acne(10, 0.2)]).verdict).toBe("stop");
  });

  it("returns NO_DIFFERENCE at the planned end when |m| is small", () => {
    const v = evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(13, 0.02), acne(15, -0.03)], "2026-11-16T00:00:00Z");
    expect(v.verdict).toBe("no_difference");
    expect(v.final).toBe(true);
  });

  it("keeps going mid-trial when the effect is not yet clear", () => {
    expect(evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(8, -0.05), acne(10, -0.06)]).verdict).toBe("keep_going");
  });

  it("extends a borderline trial when the return window allows", () => {
    const trial = makeTrial({ returnDeadline: "2026-12-01T00:00:00Z" });
    const v = evaluateTrial(trial, [...baseline("hd_acne"), acne(13, -0.1), acne(15, -0.1)], "2026-11-16T00:00:00Z");
    expect(v.extend).toBe(true);
    expect(v.verdict).toBe("keep_going");
  });

  it("gives a low-confidence NO_DIFFERENCE when there is no room to extend", () => {
    const trial = makeTrial({ returnDeadline: "2026-11-18T00:00:00Z" });
    const v = evaluateTrial(trial, [...baseline("hd_acne"), acne(13, -0.1), acne(15, -0.1)], "2026-11-16T00:00:00Z");
    expect(v.extend).toBe(false);
    expect(v.verdict).toBe("no_difference");
    expect(v.confidence).toBe("Low");
  });

  it("lowers confidence when adherence is poor", () => {
    const v = evaluateTrial(makeTrial(), [...baseline("hd_acne"), acne(7, -0.4, { adherenceSinceLast: 0.4 }), acne(9, -0.4, { adherenceSinceLast: 0.5 })]);
    expect(v.confidence).not.toBe("High");
  });
});

describe("helpers", () => {
  it("grades confidence by z-score", () => {
    expect(confidenceOf(0.3, 0.05, 2)).toBe("High");
    expect(confidenceOf(0.11, 0.05, 2)).toBe("Medium");
    expect(confidenceOf(0.03, 0.05, 2)).toBe("Low");
  });
  it("expresses Δ as percent less detected area", () => {
    expect(effectPercent(Math.log(0.77))).toBe(23);
  });
  it("fits a robust trend ignoring one outlier", () => {
    const fit = theilSen([0, 2, 4, 6, 8].map((d) => ({ day: d, delta: d === 4 ? 5 : -0.01 * d })));
    expect(fit!.slope).toBeCloseTo(-0.01, 3);
  });
});
