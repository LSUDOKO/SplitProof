import { describe, expect, it } from "vitest";
import { evaluateLight, readLight } from "@/lib/capture/lightGate";
import { buildRoiIndex, faceGeometry } from "@/lib/split/rois";
import { makeImage, syntheticLandmarks } from "./helpers/face";

const W = 400;
const H = 500;
const face = { cx: 200, cy: 250, w: 280, h: 360 };
const roi = buildRoiIndex(W, H, faceGeometry(syntheticLandmarks(face), "cheeks"));
const box = { x: 60, y: 70, width: 280, height: 360 };

/** Textured skin-ish image; `left`/`right` scale brightness of image halves. */
function photo(imgLeft: number, imgRight: number, base = 170) {
  return makeImage(W, H, (x, y) => {
    const tex = ((x * 7 + y * 13) % 17) * 3; // fine texture so the sharpness check passes
    const g = Math.min(255, (base + tex) * (x > 200 ? imgRight : imgLeft));
    return [g, g * 0.85, g * 0.75, 255];
  });
}

describe("Light Balance Gate", () => {
  it("passes an evenly lit face", () => {
    const r = readLight(photo(1, 1), roi, box);
    expect(r.imbalance).toBeLessThan(0.01);
    expect(evaluateLight(r)).toEqual([]);
  });

  it("blocks side light (1.0 vs 0.8)", () => {
    const r = readLight(photo(1, 0.8), roi, box);
    expect(r.imbalance).toBeGreaterThan(0.12);
    expect(evaluateLight(r)).toContain("side_light");
  });

  it("uses the baseline imbalance in relative mode", () => {
    const r = readLight(photo(1, 0.88), roi, box);
    expect(evaluateLight(r, r.imbalance - 0.03)).not.toContain("side_light");
    expect(evaluateLight(r, 0)).toContain("side_light");
  });

  it("flags too dark, clipped and blurry frames", () => {
    expect(evaluateLight(readLight(photo(0.3, 0.3), roi, box))).toContain("too_dark");
    expect(evaluateLight(readLight(photo(1, 1, 250), roi, box))).toContain("too_bright");
    const flat = makeImage(W, H, () => [180, 160, 140, 255]);
    expect(evaluateLight(readLight(flat, roi, box))).toContain("blurry");
  });
});
