"use client";
import { fitMidline } from "../split/midline";
import type { Landmarks, PixelBuffer, Side } from "../types";

export const COLORS = { treated: "#2563eb", control: "#d97706", ink: "#15202b", paper: "#f4f6f8", muted: "#5b6876", good: "#15803d", stop: "#b42318" };

/** Pixelate a box in place: works on every browser (canvas `filter` is missing on older Safari). */
export function pixelate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, block: number) {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  for (let by = 0; by < h; by += block)
    for (let bx = 0; bx < w; bx += block) {
      const o = (by * w + bx) * 4;
      for (let yy = by; yy < Math.min(h, by + block); yy++)
        for (let xx = bx; xx < Math.min(w, bx + block); xx++) {
          const p = (yy * w + xx) * 4;
          d[p] = d[o];
          d[p + 1] = d[o + 1];
          d[p + 2] = d[o + 2];
        }
    }
  ctx.putImageData(img, x, y);
}

/** Eye band from landmarks (brows to lower lids, outer eye corners + margin), in photo pixels. */
export function eyeBand(lm: Landmarks) {
  const xs = [lm[33][0], lm[263][0], lm[70][0], lm[300][0]];
  const ys = [lm[105][1], lm[334][1], lm[145][1], lm[374][1]];
  const pad = (Math.max(...xs) - Math.min(...xs)) * 0.12;
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad * 1.4 };
}

/**
 * Draw a scan photo into a target box, mirrored like a selfie, with eyes pixelated, the midline and
 * a soft treated/control tint. Privacy happens on this copy only; the stored photo is untouched.
 */
export function drawPrivatePhoto(ctx: CanvasRenderingContext2D, photo: PixelBuffer, lm: Landmarks, treated: Side, box: { x: number; y: number; w: number; h: number }) {
  const src = Object.assign(document.createElement("canvas"), { width: photo.width, height: photo.height });
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  sctx.putImageData(new ImageData(new Uint8ClampedArray(photo.data), photo.width, photo.height), 0, 0);
  const e = eyeBand(lm);
  pixelate(sctx, Math.max(0, Math.round(e.x)), Math.max(0, Math.round(e.y)), Math.round(e.w), Math.round(e.h), Math.max(8, Math.round(photo.width / 40)));
  const m = fitMidline(lm);
  // Tint: user's left = image right (d > 0). Drawn before mirroring so geometry stays in photo space.
  const tint = (side: Side, color: string) => {
    sctx.save();
    sctx.globalAlpha = 0.14;
    sctx.fillStyle = color;
    sctx.beginPath();
    const topX = m.b;
    const botX = m.a * photo.height + m.b;
    const edge = side === "left" ? photo.width : 0;
    sctx.moveTo(topX, 0);
    sctx.lineTo(edge, 0);
    sctx.lineTo(edge, photo.height);
    sctx.lineTo(botX, photo.height);
    sctx.closePath();
    sctx.fill();
    sctx.restore();
  };
  const other: Side = treated === "left" ? "right" : "left";
  tint(treated, COLORS.treated);
  tint(other, COLORS.control);
  sctx.strokeStyle = "rgba(255,255,255,0.9)";
  sctx.lineWidth = photo.width / 250;
  sctx.setLineDash([photo.width / 50, photo.width / 70]);
  sctx.beginPath();
  sctx.moveTo(m.b, 0);
  sctx.lineTo(m.a * photo.height + m.b, photo.height);
  sctx.stroke();

  // Cover-fit into the box, mirrored.
  const scale = Math.max(box.w / photo.width, box.h / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 28);
  ctx.clip();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.scale(-1, 1);
  ctx.drawImage(src, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Stand-in for demo trials (no photo): the split-circle mark. */
export function drawSplitMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, treated: Side) {
  const [l, rt] = treated === "left" ? [COLORS.treated, COLORS.control] : [COLORS.control, COLORS.treated];
  ctx.fillStyle = l;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.fill();
  ctx.fillStyle = rt;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(cx - r / 30, cy - r - 4, r / 15, 2 * r + 8);
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lines * lineH);
      line = w;
      if (++lines >= maxLines) return lines;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + lines++ * lineH);
  return lines;
}
