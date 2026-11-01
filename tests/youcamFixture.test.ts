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

const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/youcam/${name}/task-result.json`, "utf8"));

describe("recorded single-image task responses", () => {
  it.each(["simulation", "makeup-vto", "hair-color", "bg-blur", "earring"])("%s returns one result URL", async (name) => {
    const { AnyTaskStatus, ImageResult } = await import("@/lib/youcam/schemas");
    const r = AnyTaskStatus.parse(fixture(name));
    expect(r.data.task_status).toBe("success");
    expect(ImageResult.parse(r.data.results).url).toMatch(/^https:\/\//);
  });

  it("maps trial goals to simulation parameters and drops moisture", async () => {
    const { simulationParams } = await import("@/lib/youcam/simulation");
    expect(simulationParams(["hd_acne", "hd_redness", "hd_moisture"], 0.6)).toEqual({ acne: 0.6, redness: 0.6 });
  });
});

describe("recorded skin profile responses", () => {
  it("parses skin tone colours", async () => {
    const { AnyTaskStatus, SkinToneResult } = await import("@/lib/youcam/schemas");
    const t = SkinToneResult.parse(AnyTaskStatus.parse(fixture("skin-tone")).data.results);
    expect(t.color.skin_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.color.hair_color_name).toBe("Blonde");
  });

  it("parses the Fitzpatrick type", async () => {
    const { AnyTaskStatus, FitzpatrickResult } = await import("@/lib/youcam/schemas");
    expect(FitzpatrickResult.parse(AnyTaskStatus.parse(fixture("fitzpatrick")).data.results).fitzpatrick_scale).toBe("II");
  });

  it("maps head-angle errors to one friendly message", async () => {
    const { extractErrorCode, friendlyMessage } = await import("@/lib/youcam/errors");
    const code = extractErrorCode({ error: "error_face_angle_left_tilt" });
    expect(code).toBe("error_face_angle_left_tilt");
    expect(friendlyMessage(code)).toContain("head straight");
  });
});

describe("task parameter validation", () => {
  it("accepts documented bodies and rejects bad ones", async () => {
    const { TASK_PARAMS } = await import("@/lib/youcam/tasks");
    const foundation = { effects: [{ category: "foundation", palettes: [{ color: "#c99a7a", colorIntensity: 70, glowIntensity: 30, coverageIntensity: 70 }] }] };
    expect(TASK_PARAMS["makeup-vto"].safeParse(foundation).success).toBe(true);
    expect(TASK_PARAMS["makeup-vto"].safeParse({ effects: [{ category: "lipstick" }] }).success).toBe(false);
    expect(TASK_PARAMS["hair-color"].safeParse({ preset: "Chocolate Brown" }).success).toBe(true);
    expect(TASK_PARAMS["hair-color"].safeParse({ preset: "Neon" }).success).toBe(false);
    expect(TASK_PARAMS["skin-simulation"].safeParse({ redness: 0 }).success).toBe(false);
    expect(TASK_PARAMS["bg-blur"].safeParse({ intensity: 80 }).success).toBe(true);
  });
});
