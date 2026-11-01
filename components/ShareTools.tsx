"use client";
import { useState } from "react";
import { decodeImage } from "@/lib/capture/frame";
import { media as mediaRepo } from "@/lib/db";
import { runImageTask } from "@/lib/preview/client";
import { renderShareCard, shareOrDownload } from "@/lib/share/card";
import { reelSupported, renderReel } from "@/lib/share/reel";
import type { TrialVerdict } from "@/lib/stats/verdict";
import type { Scan, Trial } from "@/lib/types";
import { Button, Panel } from "./ui";

async function loadFrame(scan: Scan, blurBackground: boolean) {
  const m = await mediaRepo.get(scan.id);
  if (!m?.landmarks) return null;
  // Background blur runs on a COPY made for sharing (docs/14 H4), never on the stored analysis photo.
  const pixels = blurBackground ? await runImageTask("bg-blur", m.image, { intensity: 80 }) : await decodeImage(m.image);
  return { pixels, landmarks: m.landmarks as [number, number][], day: scan.dayIndex };
}

/** Share card + story reel for a trial result. Eyes are always pixelated; background blur is optional. */
export function ShareTools({ trial, scans, verdict }: { trial: Trial; scans: Scan[]; verdict: TrialVerdict }) {
  const [blur, setBlur] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>("");
  const first = scans.find((s) => s.isBaseline);
  const last = [...scans].reverse().find((s) => !s.isBaseline);
  const hasPhotos = !trial.isDemo && !!first;

  const card = async () => {
    setBusy("Making your card…");
    setError("");
    try {
      const frame = hasPhotos ? await loadFrame(last ?? first!, blur) : null;
      const blob = await renderShareCard(trial, verdict, frame ?? undefined);
      setPreview(URL.createObjectURL(blob));
      await shareOrDownload(blob, "splitside-result.png", "My split-face skincare trial");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make the card.");
    } finally {
      setBusy("");
    }
  };

  const reel = async () => {
    if (!first || !last) return;
    setBusy("Recording your 7-second reel…");
    setError("");
    try {
      const [a, b] = await Promise.all([loadFrame(first, blur), loadFrame(last, blur)]);
      if (!a || !b) throw new Error("Photos for this trial aren't on this device.");
      const blob = await renderReel(trial, verdict, a, b);
      await shareOrDownload(blob, `splitside-reel.${blob.type.includes("mp4") ? "mp4" : "webm"}`, "My split-face skincare trial");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make the reel.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Panel className="mt-3">
      <h2 className="font-semibold">Share your result</h2>
      <p className="mt-1 text-sm text-muted">Your eyes are always pixelated. Nothing is posted until you choose where to share.</p>
      {hasPhotos && (
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-ink" checked={blur} onChange={(e) => setBlur(e.target.checked)} />
          Blur my room in the background (YouCam AI, on a copy of the photo)
        </label>
      )}
      <div className="mt-3 flex flex-col gap-2">
        <Button variant="secondary" onClick={card} disabled={!!busy}>
          Create share card
        </Button>
        {hasPhotos && last && reelSupported() && (
          <Button variant="secondary" onClick={reel} disabled={!!busy}>
            Make a 7-second story reel
          </Button>
        )}
      </div>
      {busy && <p className="mt-2 text-sm text-muted" role="status">{busy}</p>}
      {error && <p className="mt-2 text-sm text-stop" role="alert">{error}</p>}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL
        <img src={preview} alt="Your share card" className="mt-3 w-full rounded-xl border border-line" />
      )}
    </Panel>
  );
}
