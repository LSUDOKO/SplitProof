import { readFileSync, readdirSync } from "node:fs";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { isSplittable, toStrength } from "@/lib/split/burden";
import { parseOutput, pickMask } from "@/lib/youcam/parse";
import { TaskStatus } from "@/lib/youcam/schemas";

const dir = "tests/fixtures/youcam/cheeks-hd";
const raw = JSON.parse(readFileSync(`${dir}/task-result.json`, "utf8"));

describe("recorded YouCam HD response", () => {
  const status = TaskStatus.parse(raw);
  const parsed = parseOutput(status.data.results!.output!);

  it("validates and parses all 8 requested concerns", () => {
    expect(status.data.task_status).toBe("success");
    expect(parsed.concerns.map((c) => c.key).sort()).toEqual(
      ["hd_acne", "hd_age_spot", "hd_moisture", "hd_oiliness", "hd_pore", "hd_radiance", "hd_redness", "hd_texture"],
    );
    expect(parsed.overall).toBeCloseTo(74.625);
    expect(parsed.skinAge).toBe(90);
  });

  it("keeps raw_score and region sub-scores for pores", () => {
    const pore = parsed.concerns.find((c) => c.key === "hd_pore")!;
    expect(pore.rawScore).toBeCloseTo(55.2589, 3);
    expect(Object.keys(pore.regions!).sort()).toEqual(["cheek", "forehead", "nose"]);
    expect(pickMask(pore.masks, "cheek")).toContain("hd_pore_output_cheek.png");
    expect(pickMask(pore.masks, "eyelid")).toContain("hd_pore_output_all.png");
  });

  it("decodes every recorded mask as a spatial, splittable map at photo size", () => {
    for (const f of readdirSync(`${dir}/masks`)) {
      const png = PNG.sync.read(readFileSync(`${dir}/masks/${f}`));
      expect([png.width, png.height]).toEqual([1080, 1440]);
      const s = toStrength({ width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) });
      expect(isSplittable(s), f).toBe(true);
    }
  });
});

describe("recorded YouCam skin simulation response", () => {
  it("validates the single result URL shape", async () => {
    const { SimulationStatus } = await import("@/lib/youcam/schemas");
    const sim = SimulationStatus.parse(JSON.parse(readFileSync("tests/fixtures/youcam/simulation/task-result.json", "utf8")));
    expect(sim.data.task_status).toBe("success");
    expect(sim.data.results?.url).toMatch(/\.png$/);
  });

  it("maps trial goals to simulation parameters and drops moisture", async () => {
    const { simulationParams } = await import("@/lib/youcam/simulation");
    expect(simulationParams(["hd_acne", "hd_redness", "hd_moisture"], 0.6)).toEqual({ acne: 0.6, redness: 0.6 });
  });
});
