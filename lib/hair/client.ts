"use client";
import type { Side } from "../types";

const W = 1080;
const H = 1440;

/** The frizz analyzer requires all three views at the same size: cover-crop each to 1080×1440. */
export async function prepareView(file: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.max(W / bmp.width, H / bmp.height);
  const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
  c.getContext("2d")!.drawImage(bmp, (W - bmp.width * scale) / 2, (H - bmp.height * scale) / 2, bmp.width * scale, bmp.height * scale);
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
  form.set("treatedSide", treatedSide);
  const res = await fetch("/api/hair", { method: "POST", body: form });
  const out = await res.json();
  if (!res.ok || !out.treated) throw new Error(out.message ?? "The hair check failed. Please try again.");
  return out;
}
