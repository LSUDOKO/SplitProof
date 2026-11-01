import { describe, expect, it } from "vitest";
import { detectMaskChannel, isSplittable, maskBurden } from "@/lib/split/burden";
import { fitMidline } from "@/lib/split/midline";
import { buildRoiIndex, faceGeometry, sideOfPoint } from "@/lib/split/rois";
import { makeImage, syntheticLandmarks } from "./helpers/face";

const W = 400;
const H = 500;
const face = { cx: 200, cy: 250, w: 280, h: 360 };

describe("split engine", () => {
  it("maps image-right to the user's LEFT side (un-mirrored selfie)", () => {
    const m = fitMidline(syntheticLandmarks(face));
    expect(sideOfPoint(m, 300, 250)).toBe("left");
    expect(sideOfPoint(m, 100, 250)).toBe("right");
  });

  it("puts burden on the user's left cheek when the mask covers image-right", () => {
    const lm = syntheticLandmarks(face);
    const roi = buildRoiIndex(W, H, faceGeometry(lm, "cheeks"));
    const mask = makeImage(W, H, (x) => [0, 0, 0, x > 200 ? 200 : 0]);
    const b = maskBurden(mask, roi);
    expect(b.left).toBeCloseTo(200 / 255, 2);
    expect(b.right).toBe(0);
  });

  it("builds mirror ROIs with near-equal area", () => {
    const roi = buildRoiIndex(W, H, faceGeometry(syntheticLandmarks(face), "cheeks"));
    expect(roi.left.length).toBeGreaterThan(500);
    expect(Math.abs(roi.left.length - roi.right.length) / roi.left.length).toBeLessThan(0.05);
  });

  it("excludes the midline buffer band", () => {
    const lm = syntheticLandmarks(face);
    const roi = buildRoiIndex(W, H, faceGeometry(lm, "forehead"));
    const band = 0.035 * face.w;
    const mask = makeImage(W, H, (x) => [0, 0, 0, Math.abs(x - 200) < band ? 255 : 0]);
    const b = maskBurden(mask, roi);
    expect(b.left).toBe(0);
    expect(b.right).toBe(0);
  });

  it("still splits correctly with a 10° head roll", () => {
    const lm = syntheticLandmarks({ ...face, rollDeg: 10 });
    const roi = buildRoiIndex(W, H, faceGeometry(lm, "cheeks"));
    const t = (10 * Math.PI) / 180;
    // Mask covers the user's left half in the rotated face frame.
    const mask = makeImage(W, H, (x, y) => {
      const u = (x - 200) * Math.cos(t) + (y - 250) * Math.sin(t);
      return [0, 0, 0, u > 0 ? 220 : 0];
    });
    const b = maskBurden(mask, roi);
    expect(b.left).toBeCloseTo(220 / 255, 2);
    expect(b.right).toBeLessThan(0.01);
  });

  it("samples masks with a different resolution than the photo", () => {
    const roi = buildRoiIndex(W, H, faceGeometry(syntheticLandmarks(face), "under_eyes"));
    const mask = makeImage(W / 2, H / 2, (x) => [0, 0, 0, x > 100 ? 255 : 0]);
    const b = maskBurden(mask, roi);
    expect(b.left).toBeCloseTo(1, 2);
    expect(b.right).toBe(0);
  });

  it("falls back to luminance for opaque masks and flags uniform masks", () => {
    const opaque = makeImage(20, 20, (x) => (x > 10 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
    expect(detectMaskChannel(opaque)).toBe("luma");
    expect(isSplittable(opaque)).toBe(true);
    expect(isSplittable(makeImage(20, 20, () => [0, 0, 0, 90]))).toBe(false);
  });
});
