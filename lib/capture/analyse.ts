"use client";
import { maskBurden, toStrength } from "../split/burden";
import { buildRoiIndex, faceGeometry } from "../split/rois";
import type { ConcernKey, ConcernScore, Landmarks, Side, Zone } from "../types";
import { dataUrlToBlob, decodeImage } from "./frame";

export interface PollSuccess {
  status: "success";
  concerns: ({ key: ConcernKey } & ConcernScore)[];
  masks: Partial<Record<ConcernKey, string | null>>;
}
export type PollResult = { status: "running" } | { status: "error"; code: string; message: string } | PollSuccess;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upload → task → poll (2 s, 90 s timeout, backoff on network errors). */
export async function analyseOnYoucam(image: Blob, zone: Zone, onStage: (s: "uploading" | "analysing") => void): Promise<PollSuccess> {
  onStage("uploading");
  const form = new FormData();
  form.set("image", image, "scan.jpg");
  form.set("zone", zone);
  const res = await fetch("/api/scan", { method: "POST", body: form });
  const created = await res.json();
  if (!res.ok || !created.taskId) throw new Error(created.message ?? "Upload failed. Please try again.");
  onStage("analysing");
  const deadline = Date.now() + 90_000;
  let wait = 2000;
  while (Date.now() < deadline) {
    await sleep(wait);
    let poll: PollResult;
    try {
      const r = await fetch(`/api/scan/${encodeURIComponent(created.taskId)}?zone=${zone}`);
      poll = await r.json();
      wait = 2000;
    } catch {
      wait = Math.min(wait * 2, 8000);
      continue;
    }
    if (poll.status === "success") return poll;
    if (poll.status === "error") throw new Error(poll.message);
  }
  throw new Error("The analysis took too long. Please try again.");
}

/** Split engine on real masks: one ROI raster per photo, one burden pair per concern. */
export async function measureBurdens(masks: PollSuccess["masks"], landmarks: Landmarks, width: number, height: number, zone: Zone) {
  const roi = buildRoiIndex(width, height, faceGeometry(landmarks, zone));
  const burdens: Partial<Record<ConcernKey, Record<Side, number>>> = {};
  const blobs: Partial<Record<ConcernKey, Blob>> = {};
  for (const [key, url] of Object.entries(masks) as [ConcernKey, string | null][]) {
    if (!url) continue;
    const blob = await dataUrlToBlob(url);
    blobs[key] = blob;
    burdens[key] = maskBurden(toStrength(await decodeImage(blob)), roi);
  }
  return { burdens, blobs, roiPixels: roi.left.length };
}
