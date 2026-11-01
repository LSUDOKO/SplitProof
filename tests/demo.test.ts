import { describe, expect, it } from "vitest";
import { buildDemo } from "@/lib/demo/seed";
import { evaluateTrial } from "@/lib/stats/verdict";

describe("demo seed", () => {
  const { trials, scans } = buildDemo("2026-11-01T08:00:00.000Z");
  const verdictOf = (id: string) => {
    const t = trials.find((x) => x.id === id)!;
    return evaluateTrial(t, scans.filter((s) => s.trialId === id), "2026-11-01T08:00:00.000Z");
  };

  it("is always labelled as demo data", () => expect(trials.every((t) => t.isDemo)).toBe(true));
  it("acne serum is Working", () => {
    const v = verdictOf("demo-acne-serum");
    expect(v.verdict).toBe("working");
    expect(v.confidence).toBe("High");
  });
  it("glycolic toner trips the sentinel", () => expect(verdictOf("demo-glycolic-toner").verdict).toBe("stop"));
  it("head-to-head moisturisers show no real difference", () => expect(verdictOf("demo-moisturiser-h2h").verdict).toBe("no_difference"));
  it("brightening essence stopped on a redness spike", () => expect(verdictOf("demo-brightening-essence").sentinel.reason).toBe("redness_spike"));
});
