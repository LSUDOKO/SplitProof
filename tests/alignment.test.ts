import { describe, expect, it } from "vitest";
import { eulerFromMatrix, evaluatePose, framing } from "@/lib/capture/alignment";
import { syntheticLandmarks } from "./helpers/face";

const good = { yaw: 1, pitch: 2, roll: 1, faceWidth: 0.7, centreOffset: 0.02, blink: 0.1, jawOpen: 0.02 };

describe("pose gate", () => {
  it("passes a straight, centred, well-sized face", () => expect(evaluatePose(good)).toEqual([]));
  it("flags each failure", () => {
    expect(evaluatePose(null)).toEqual(["no_face"]);
    expect(evaluatePose({ ...good, faceWidth: 0.4 })).toContain("too_far");
    expect(evaluatePose({ ...good, faceWidth: 0.9 })).toContain("too_close");
    expect(evaluatePose({ ...good, yaw: 9 })).toContain("turned");
    expect(evaluatePose({ ...good, roll: -8 })).toContain("tilted");
    expect(evaluatePose({ ...good, blink: 0.8 })).toContain("eyes_closed");
    expect(evaluatePose({ ...good, centreOffset: 0.2 })).toContain("off_centre");
  });
  it("reads roll from a rotation matrix", () => {
    const t = (10 * Math.PI) / 180;
    // column-major rotation about z
    const m = [Math.cos(t), Math.sin(t), 0, 0, -Math.sin(t), Math.cos(t), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const e = eulerFromMatrix(m);
    expect(e.roll).toBeCloseTo(10, 5);
    expect(e.yaw).toBeCloseTo(0, 5);
  });
  it("measures face width from contour landmarks", () => {
    const f = framing(syntheticLandmarks({ cx: 540, cy: 720, w: 756, h: 1000 }), 1080, 1440);
    expect(f.faceWidth).toBeCloseTo(0.7, 3);
    expect(f.centreOffset).toBeLessThan(0.01);
  });
});

describe("ghost outline", () => {
  it("is ~0 for the same face at another size/position and grows when the face changes shape", async () => {
    const { ghostDistance, FACE_OVAL } = await import("@/lib/capture/alignment");
    const idx = [234, 454, 10, 152, 33, 263, 61, 291];
    const a = syntheticLandmarks({ cx: 500, cy: 700, w: 700, h: 900 });
    const b = syntheticLandmarks({ cx: 560, cy: 740, w: 770, h: 990 });
    const c = syntheticLandmarks({ cx: 500, cy: 700, w: 700, h: 1200 });
    expect(ghostDistance(a, b, idx)).toBeLessThan(0.001);
    const rolled = syntheticLandmarks({ cx: 500, cy: 700, w: 700, h: 900, rollDeg: 5 });
    expect(ghostDistance(a, rolled, idx)).toBeLessThan(0.001);
    expect(ghostDistance(a, c, idx)).toBeGreaterThan(0.04);
    expect(FACE_OVAL).toContain(454);
  });
});
