import { describe, expect, it } from "vitest";
import { runSentinel, sentinelK } from "@/lib/stats/sentinel";
import { evaluateTrial } from "@/lib/stats/verdict";
import { makeScan, makeTrial } from "./helpers/trial";

const A0 = 0;
const base = () => [0, 0.01, -0.01].map((d) => makeScan(0, { hd_redness: A0 + d, hd_acne: A0 + d }));
const red = (day: number, delta: number, acne = 0, over = {}) => makeScan(day, { hd_redness: A0 + delta, hd_acne: A0 + acne }, over);
// SDC with sd floor 0.05 ≈ 0.139; WATCH ≥ 0.097
describe("irritation sentinel", () => {
  const trial = makeTrial({ goals: ["hd_redness"] });

  it("is ok when redness is flat", () => {
    expect(runSentinel(trial, [...base(), red(2, 0.02), red(4, 0.01)]).level).toBe("ok");
  });
  it("watches a single moderate rise", () => {
    expect(runSentinel(trial, [...base(), red(2, 0.11)]).level).toBe("watch");
  });
  it("stops on a big redness spike", () => {
    const r = runSentinel(trial, [...base(), red(2, 0.2)]);
    expect(r).toMatchObject({ level: "stop", reason: "redness_spike" });
  });
  it("stops on two consecutive watches", () => {
    expect(runSentinel(trial, [...base(), red(2, 0.11), red(4, 0.12)]).reason).toBe("redness_sustained");
  });
  it("stops on acne rising beyond SDC on two scans", () => {
    expect(runSentinel(trial, [...base(), red(2, 0, 0.2), red(4, 0, 0.25)]).reason).toBe("acne_sustained");
  });
  it("lowers the threshold for Fitzpatrick IV–VI with a harsh active", () => {
    const harsh = makeTrial({ fitzpatrick: 5, products: { A: { name: "Peel", ingredientClasses: ["aha"] } } });
    expect(sentinelK(harsh)).toBe(0.7);
    expect(sentinelK(makeTrial({ fitzpatrick: 2, products: { A: { name: "Peel", ingredientClasses: ["aha"] } } }))).toBe(1);
    expect(runSentinel(harsh, [...base(), red(2, 0.11)]).level).toBe("stop");
  });
  it("lets reported symptoms override the statistics", () => {
    const r = runSentinel(trial, [...base(), red(2, 0, 0, { symptoms: true })]);
    expect(r).toMatchObject({ level: "stop", reason: "symptoms" });
    expect(evaluateTrial(trial, [...base(), red(2, 0, 0, { symptoms: true })]).verdict).toBe("stop");
  });
});
