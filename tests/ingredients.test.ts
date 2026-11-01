import { describe, expect, it } from "vitest";
import { classify, ingredientProfile, parseInci } from "@/lib/ingredients/classes";
import { makeTrial } from "./helpers/trial";

describe("ingredients", () => {
  it("classifies harsh actives from an INCI list", () => {
    const inci = parseInci("Aqua, Glycolic Acid, Glycerin, Parfum, Retinol, Alcohol Denat.");
    expect(classify(inci).sort()).toEqual(["aha", "alcohol_denat", "fragrance", "retinoid"]);
    expect(classify(parseInci("Aqua, Glycerin, Ceramide NP"))).toEqual([]);
  });

  it("flags ingredients common to irritating trials as a pattern", () => {
    const t = (inci: string[]) => makeTrial({ products: { A: { name: "x", ingredientsInci: inci } } });
    const flags = ingredientProfile([
      { trial: t(["parfum", "aqua"]), verdict: "stop" },
      { trial: t(["parfum", "glycerin"]), verdict: "worse" },
      { trial: t(["parfum", "aqua"]), verdict: "working" },
      { trial: t(["aqua"]), verdict: "keep_going" },
    ]);
    expect(flags).toEqual([{ name: "parfum", seenStop: 2, seenTotal: 3 }]);
  });
});
