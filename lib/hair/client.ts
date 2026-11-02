"use client";
import type { Side } from "../types";

const W = 1080;
const H = 1440;

/** The frizz analyzer requires all three views at the same size: cover-crop each to 1080×1440. */
export async function prepareView(file: Blob, mirror = false): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.max(W / bmp.width, H / bmp.height);
  const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = c.getContext("2d")!;
  if (mirror) ctx.setTransform(-1, 0, 0, 1, W, 0);
  ctx.drawImage(bmp, (W - bmp.width * scale) / 2, (H - bmp.height * scale) / 2, bmp.width * scale, bmp.height * scale);
  bmp.close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", 0.92));
}

export interface HairCheckResult {
  treated: { level: 0 | 1 | 2 | 3; term?: string };
  control: { level: 0 | 1 | 2 | 3; term?: string };
}

export async function runHairCheck(views: { front: Blob; left: Blob; right: Blob }, treatedSide: Side): Promise<HairCheckResult> {
  const form = new FormData();
  for (const [k, v] of Object.entries(views)) form.set(k, v, `${k}.jpg`);
  // The analyzer needs one view turned each way; a side's mirror image stands in for the other side.
  form.set("leftMirror", await prepareView(views.left, true), "leftMirror.jpg");
  form.set("rightMirror", await prepareView(views.right, true), "rightMirror.jpg");
  form.set("treatedSide", treatedSide);
  const res = await fetch("/api/hair", { method: "POST", body: form });
  const out = await res.json();
  if (!res.ok || !out.treated) throw new Error(out.message ?? "The hair check failed. Please try again.");
  return out;
}
