"use client";
import type { TrialVerdict } from "../stats/verdict";
import { VERDICT_TITLES, explainVerdict } from "../trial/explain";
import type { Landmarks, PixelBuffer, Trial } from "../types";
import { COLORS, drawPrivatePhoto, drawSplitMark, wrapText } from "./draw";

const W = 1080;
const H = 1350;

/** Δ as % more(+)/less(−) detected area on the treated side than expected. */
const pct = (d: number) => (Math.exp(d) - 1) * 100;

/** Shareable result card (docs/14 H4): privacy-safe photo, verdict, effect and the trend. PNG. */
export async function renderShareCard(trial: Trial, v: TrialVerdict, photo?: { pixels: PixelBuffer; landmarks: Landmarks }): Promise<Blob> {
  await document.fonts.ready;
  const font = getComputedStyle(document.body).fontFamily;
  const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);

  if (photo) drawPrivatePhoto(ctx, photo.pixels, photo.landmarks, trial.treatedSide, { x: 60, y: 60, w: W - 120, h: 700 });
  else drawSplitMark(ctx, W / 2, 410, 260, trial.treatedSide);

  const bad = v.verdict === "stop" || v.verdict === "worse";
  ctx.fillStyle = bad ? COLORS.stop : v.verdict === "working" ? COLORS.good : COLORS.ink;
  ctx.font = `700 64px ${font}`;
  ctx.fillText(VERDICT_TITLES[v.verdict], 60, 850);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `500 34px ${font}`;
  const name = trial.mode === "head_to_head" ? `${trial.products.A.name} vs ${trial.products.B?.name}` : trial.products.A.name;
  ctx.fillText(name.length > 46 ? `${name.slice(0, 45)}…` : name, 60, 905);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 30px ${font}`;
  const lines = wrapText(ctx, explainVerdict(trial, v, false), 60, 960, W - 120, 42, 4);

  // Sparkline of the lead concern.
  const series = (v.concerns.find((x) => x.verdict === v.verdict) ?? v.concerns[0])?.series;
  if (series && series.post.length > 1) {
    const top = 960 + lines * 42 + 20;
    const h = Math.max(80, H - 110 - top);
    const pts = [0, ...series.post.map((p) => pct(p.delta))];
    const days = [0, ...series.post.map((p) => p.day)];
    const ext = Math.max(10, ...pts.map(Math.abs));
    const x = (d: number) => 60 + (d / Math.max(1, days.at(-1)!)) * (W - 120);
    const y = (val: number) => top + h / 2 - (val / ext) * (h / 2);
    const band = pct(series.baseline.sdc);
    ctx.fillStyle = "rgba(91,104,118,0.12)";
    ctx.fillRect(60, y(band), W - 120, y(-band) - y(band));
    ctx.strokeStyle = COLORS.treated;
    ctx.lineWidth = 6;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(x(days[i]), y(p)) : ctx.moveTo(x(days[i]), y(p))));
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 26px ${font}`;
  ctx.fillText(`SplitSide · day ${v.days} · measured with YouCam AI Skin Analysis${trial.isDemo ? " · demo data" : ""}`, 60, H - 50);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't create the image"))), "image/png"));
}

/** Web Share with files when available (phones), download otherwise. */
export async function shareOrDownload(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
