import { describe, expect, it } from "vitest";
import { deltaE2000, hexToLab, labToRgb, rgbToLab, undertone } from "@/lib/preview/color";
import { splitComposite } from "@/lib/preview/composite";
import { hairShortlist } from "@/lib/preview/hair";
import { seamScore } from "@/lib/preview/seam";
import { SHADES, shortlistShades } from "@/lib/preview/shades";
import { fitMidline } from "@/lib/split/midline";
import { buildRoiIndex, faceGeometry } from "@/lib/split/rois";
import { makeImage, syntheticLandmarks } from "./helpers/face";

describe("colour science", () => {
  it("matches CIEDE2000 reference pairs (Sharma 2005)", () => {
    expect(deltaE2000({ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 })).toBeCloseTo(2.0425, 3);
    expect(deltaE2000({ L: 50, a: 0, b: 0 }, { L: 50, a: -1, b: 2 })).toBeCloseTo(2.3669, 3);
    expect(deltaE2000({ L: 50, a: 2.5, b: 0 }, { L: 73, a: 25, b: -18 })).toBeCloseTo(27.1492, 3);
  });
  it("round-trips sRGB ⇄ Lab", () => {
    const lab = rgbToLab([187, 152, 129]);
    expect(labToRgb(lab)).toEqual([187, 152, 129]);
  });
  it("reads undertone from hue", () => {
    expect(undertone(hexToLab("#c99a6a"))).toBe("warm");
    expect(undertone(hexToLab("#d0a0a8"))).toBe("cool");
  });
});

describe("shade shortlist", () => {
  it("offers 24 generic shades and picks the closest to measured skin", () => {
    expect(SHADES).toHaveLength(24);
    const picks = shortlistShades("#bb9881");
    expect(picks).toHaveLength(3);
    expect(picks[0].deltaE).toBeLessThanOrEqual(picks[2].deltaE);
    expect(picks[0].deltaE).toBeLessThan(8);
  });
});

describe("split composite", () => {
  const W = 200;
  const H = 260;
  const red = makeImage(W, H, () => [255, 0, 0, 255]);
  const blue = makeImage(W - 2, H, () => [0, 0, 255, 255]);

  it("puts each source on the user's own side (user's left = image right)", () => {
    const m = fitMidline(syntheticLandmarks({ cx: 100, cy: 130, w: 140, h: 180 }));
    const out = splitComposite(W, H, m, { left: blue, right: red });
    const at = (x: number, y: number) => Array.from(out.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3));
    expect(at(180, 130)).toEqual([0, 0, 255]);
    expect(at(20, 130)).toEqual([255, 0, 0]);
  });

  it("follows a tilted midline", () => {
    const m = fitMidline(syntheticLandmarks({ cx: 100, cy: 130, w: 140, h: 180, rollDeg: 10 }));
    const out = splitComposite(W, H, m, { left: blue, right: red });
    // Rolled +10°: the midline sits right of centre at the top and left of centre at the bottom,
    // so the same column x=110 belongs to different sides.
    const px = (x: number, y: number) => Array.from(out.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3));
    expect(px(110, 5)).toEqual([255, 0, 0]);
    expect(px(110, 255)).toEqual([0, 0, 255]);
  });
});

describe("seam score", () => {
  const lm = syntheticLandmarks({ cx: 100, cy: 130, w: 140, h: 180 });
  const roi = buildRoiIndex(200, 260, faceGeometry(lm, "cheeks"));
  const skin = makeImage(200, 260, () => [187, 152, 129, 255]);
  it("calls a near-identical shade a blend", () => {
    expect(seamScore(skin, makeImage(200, 260, () => [189, 153, 130, 255]), roi).verdict).toBe("blends");
  });
  it("flags a much lighter shade as too light", () => {
    const s = seamScore(skin, makeImage(200, 260, () => [235, 205, 185, 255]), roi);
    expect(s.verdict).toBe("too_light");
    expect(s.dL).toBeGreaterThan(0);
  });
  it("flags a darker shade", () => {
    expect(seamScore(skin, makeImage(200, 260, () => [165, 130, 108, 255]), roi).verdict).toMatch(/dark/);
  });
});

describe("hair shortlist", () => {
  it("suggests by undertone and warns about lifting dark hair", () => {
    const warm = hairShortlist("warm", "Black");
    expect(warm.map((h) => h.preset)).toContain("Honey Blonde");
    expect(warm.find((h) => h.preset === "Honey Blonde")!.note).toMatch(/bleach/);
    expect(hairShortlist("cool")[0].preset).toBe("Ash Gray");
  });
});
