"use client";
import { dataUrlToBlob, decodeImage, targetSize, toJpeg } from "../capture/frame";
import { getLandmarker, toPixels } from "../capture/landmarks";
import type { Landmarks, PixelBuffer } from "../types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface PreparedPhoto {
  blob: Blob;
  pixels: PixelBuffer;
  landmarks: Landmarks;
  width: number;
  height: number;
}

/** Resize to the HD envelope, find the face. Preview photos may come from the gallery: they are never measured. */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const bmp = await createImageBitmap(file);
  const { width, height } = targetSize(bmp.width, bmp.height);
  const canvas = Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const lm = await getLandmarker();
  const landmarks = toPixels(lm.detectForVideo(canvas, performance.now()), width, height);
  if (!landmarks) throw new Error("We couldn't find a face. Use a front-facing photo with your whole face visible.");
  const img = ctx.getImageData(0, 0, width, height);
  return { blob: await toJpeg(canvas), pixels: { width, height, data: img.data }, landmarks, width, height };
}

/** Generic image task: POST /api/preview → poll → generated image as pixels. */
export async function runImageTask(kind: string, image: Blob, params: object): Promise<PixelBuffer> {
  const form = new FormData();
  form.set("image", image, "photo.jpg");
  form.set("kind", kind);
  form.set("params", JSON.stringify(params));
  const created = await (await fetch("/api/preview", { method: "POST", body: form })).json();
  if (!created.taskId) throw new Error(created.message ?? "The preview couldn't start. Please try again.");
  for (let i = 0; i < 45; i++) {
    await sleep(2000);
    const r = await (await fetch(`/api/preview/${encodeURIComponent(created.taskId)}?kind=${encodeURIComponent(kind)}`)).json();
    if (r.status === "success") return decodeImage(await dataUrlToBlob(r.image));
    if (r.status === "error") throw new Error(r.message);
  }
  throw new Error("The preview took too long. Please try again.");
}

export interface SkinProfile {
  skinColor: string;
  hairColor?: string;
  hairColorName?: string;
  eyeColorName?: string;
  fitzpatrick: 1 | 2 | 3 | 4 | 5 | 6;
}

/** Skin tone + Fitzpatrick type from one photo (YouCam skin tone analysis + Fitzpatrick analyzer). */
export async function getProfile(image: Blob): Promise<SkinProfile> {
  const form = new FormData();
  form.set("image", image, "photo.jpg");
  const r = await (await fetch("/api/profile", { method: "POST", body: form })).json();
  if (!r.skinColor) throw new Error(r.message ?? "Couldn't read your skin tone. Try a front-facing photo in even light.");
  return r;
}

export function bufferToBlob(buf: PixelBuffer, type = "image/jpeg"): Promise<Blob> {
  const c = Object.assign(document.createElement("canvas"), { width: buf.width, height: buf.height });
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height), 0, 0);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), type, 0.9));
}
