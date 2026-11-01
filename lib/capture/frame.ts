"use client";

/** HD analysis needs short side ≥ 1080 and long side ≤ 2560 (docs/05). */
export function targetSize(w: number, h: number) {
  const short = Math.min(w, h);
  const long = Math.max(w, h);
  let scale = 1;
  if (short < 1080) scale = 1080 / short;
  if (long * scale > 2560) scale = 2560 / long;
  return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
}

/** Un-mirrored frame grab at analysis size. Never enhanced or filtered (A7). */
export function grabFrame(video: HTMLVideoElement) {
  const { width, height, scale } = targetSize(video.videoWidth, video.videoHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, 0, 0, width, height);
  return { canvas, ctx, width, height, scale };
}

export const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.92));

/** Decode a data URL (PNG mask) to RGBA pixels. */
export async function decodeImage(src: Blob): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const bmp = await createImageBitmap(src);
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, bmp.width, bmp.height);
  bmp.close();
  return { width: img.width, height: img.height, data: img.data };
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}
