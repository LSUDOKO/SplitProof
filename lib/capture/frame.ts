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

/**
 * Centre 3:4 portrait crop of the camera frame. Landscape webcams (16:9) would otherwise
 * never let a face reach 60–80% of the frame width; the preview shows exactly this crop.
 */
export function portraitCrop(vw: number, vh: number) {
  const target = 3 / 4;
  if (vw / vh > target) {
    const w = Math.round(vh * target);
    return { x: Math.round((vw - w) / 2), y: 0, width: w, height: vh };
  }
  const h = Math.min(vh, Math.round(vw / target));
  return { x: 0, y: Math.round((vh - h) / 2), width: vw, height: h };
}

/**
 * Un-mirrored frame grab of the portrait crop at analysis size. Never enhanced or filtered (A7).
 * `native` is the same frame at the camera's own resolution: upscaling softens edges, so sharpness is judged there.
 */
export function grabFrame(video: HTMLVideoElement) {
  const crop = portraitCrop(video.videoWidth, video.videoHeight);
  const { width, height, scale } = targetSize(crop.width, crop.height);
  const nativeCanvas = document.createElement("canvas");
  nativeCanvas.width = crop.width;
  nativeCanvas.height = crop.height;
  const native = nativeCanvas.getContext("2d", { willReadFrequently: true })!;
  native.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(nativeCanvas, 0, 0, width, height);
  return { canvas, ctx, native, width, height, scale };
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
