"use client";
/* eslint-disable @next/next/no-img-element -- debug data URL */
import { useState } from "react";
import { SplitPhoto } from "@/components/SplitPhoto";
import { Button } from "@/components/ui";
import { framing } from "@/lib/capture/alignment";
import { analyseOnYoucam, measureBurdens } from "@/lib/capture/analyse";
import { targetSize, toJpeg } from "@/lib/capture/frame";
import { getLandmarker, toPixels } from "@/lib/capture/landmarks";
import { readLight } from "@/lib/capture/lightGate";
import { buildRoiIndex, faceGeometry } from "@/lib/split/rois";
import type { ScanMedia } from "@/lib/types";

export function YoucamDevTool() {
  const [log, setLog] = useState<string>("");
  const [media, setMedia] = useState<{ m: ScanMedia; w: number; h: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [debug, setDebug] = useState("");

  const run = async (upload: boolean) => {
    if (!file) return;
    const bmp = await createImageBitmap(file);
    const { width, height } = targetSize(bmp.width, bmp.height);
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bmp, 0, 0, width, height);
    const lm = await getLandmarker();
    const pts = toPixels(lm.detectForVideo(canvas, performance.now()), width, height);
    if (!pts) return setLog("No face found");
    const roi = buildRoiIndex(width, height, faceGeometry(pts, "cheeks"));
    const light = readLight(ctx.getImageData(0, 0, width, height), roi, framing(pts, width, height).box);
    // Debug overlay: user-left ROI blue, user-right amber, midline landmarks white.
    const dbg = ctx.getImageData(0, 0, width, height);
    for (const p of roi.left) dbg.data.set([37, 99, 235, 255], p * 4);
    for (const p of roi.right) dbg.data.set([217, 119, 6, 255], p * 4);
    const c2 = Object.assign(document.createElement("canvas"), { width, height });
    const x2 = c2.getContext("2d")!;
    x2.putImageData(dbg, 0, 0);
    x2.fillStyle = "white";
    for (const i of [10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 17, 18, 200, 199, 175, 152, 234, 454, 374, 145, 327, 98, 291, 61]) x2.fillRect(pts[i][0] - 6, pts[i][1] - 6, 12, 12);
    setDebug(c2.toDataURL("image/jpeg", 0.7));
    let out: Record<string, unknown> = { width, height, roiPixels: roi.left.length, light, faceWidth: framing(pts, width, height).faceWidth };
    setLog(JSON.stringify(out, null, 2));
    if (!upload) return;
    const image = await toJpeg(canvas);
    const res = await analyseOnYoucam(image, "cheeks", (s) => setLog((l) => `${l}\n${s}…`));
    const { burdens, blobs } = await measureBurdens(res.masks, pts, width, height, "cheeks");
    out = { ...out, scores: res.concerns.map((c) => [c.key, c.rawScore]), burdens };
    setLog(JSON.stringify(out, null, 2));
    setMedia({ m: { scanId: "dev", image, masks: blobs, landmarks: pts }, w: width, h: height });
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">YouCam pipeline (dev)</h1>
      <input type="file" accept="image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => run(false)} disabled={!file}>Landmarks + light only</Button>
        <Button onClick={() => run(true).catch((e) => setLog(String(e)))} disabled={!file}>Analyse (16 units)</Button>
      </div>
      {debug && <img id="debug" src={debug} alt="ROI debug overlay" className="w-full" />}
      {media && <SplitPhoto media={media.m} treatedSide="left" width={media.w} height={media.h} />}
      <pre id="log" className="whitespace-pre-wrap text-xs">{log}</pre>
    </main>
  );
}
