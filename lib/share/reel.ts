"use client";
import type { TrialVerdict } from "../stats/verdict";
import { VERDICT_TITLES, explainVerdict } from "../trial/explain";
import type { Landmarks, PixelBuffer, Trial } from "../types";
import { COLORS, drawPrivatePhoto, wrapText } from "./draw";

const W = 720;
const H = 900;
const FPS = 30;
const SECONDS = 7;

export const reelSupported = () => typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";

function mimeType() {
  return ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

type Frame = { pixels: PixelBuffer; landmarks: Landmarks; day: number };

/**
 * Trial Story Reel (docs/14 H5): day-0 split photo → last split photo → verdict, cross-faded.
 * Built only from the user's real photos; no generative video on faces.
 */
export async function renderReel(trial: Trial, v: TrialVerdict, first: Frame, last: Frame): Promise<Blob> {
  const font = getComputedStyle(document.body).fontFamily;
  const layer = (f: Frame, label: string) => {
    const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);
    drawPrivatePhoto(ctx, f.pixels, f.landmarks, trial.treatedSide, { x: 30, y: 30, w: W - 60, h: H - 160 });
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 44px ${font}`;
    ctx.fillText(label, 40, H - 60);
    return c;
  };
  const verdictLayer = () => {
    const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);
    const bad = v.verdict === "stop" || v.verdict === "worse";
    ctx.fillStyle = bad ? COLORS.stop : v.verdict === "working" ? COLORS.good : COLORS.ink;
    ctx.font = `700 64px ${font}`;
    ctx.fillText(VERDICT_TITLES[v.verdict], 40, 300);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `400 32px ${font}`;
    wrapText(ctx, explainVerdict(trial, v, false), 40, 370, W - 80, 44, 6);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 24px ${font}`;
    ctx.fillText("SplitSide · one side treated, one side control", 40, H - 60);
    return c;
  };
  const slides = [layer(first.pixels ? first : last, `Day ${first.day}`), layer(last, `Day ${last.day}`), verdictLayer()];

  const canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = canvas.getContext("2d")!;
  const rec = new MediaRecorder(canvas.captureStream(FPS), { mimeType: mimeType(), videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: rec.mimeType }))));
  rec.start();
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      // 0–2 s day 0, 2–3 s fade, 3–4.5 s last day, 4.5–5.5 s fade, 5.5–7 s verdict.
      const stage = t < 2 ? [0, 0] : t < 3 ? [0, t - 2] : t < 4.5 ? [1, 0] : t < 5.5 ? [1, t - 4.5] : [2, 0];
      ctx.globalAlpha = 1;
      ctx.drawImage(slides[stage[0]], 0, 0);
      if (stage[1] > 0) {
        ctx.globalAlpha = stage[1];
        ctx.drawImage(slides[stage[0] + 1], 0, 0);
      }
      if (t < SECONDS) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
  rec.stop();
  return done;
}
