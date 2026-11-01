"use client";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Button, Panel } from "@/components/ui";
import { newId, previews, settings } from "@/lib/db";
import { bufferToBlob, getProfile, runEarrings, type PreparedPhoto, type SkinProfile } from "@/lib/preview/client";
import { metalHint } from "@/lib/preview/earrings";
import { skinUndertone } from "@/lib/preview/shades";
import type { Landmarks, PixelBuffer, Side } from "@/lib/types";

/** Close-up of one ear: below the face-contour landmark (234 = image-left, 454 = image-right). */
function EarCrop({ image, landmarks, imageSide, label }: { image: PixelBuffer; landmarks: Landmarks; imageSide: "left" | "right"; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const faceW = Math.abs(landmarks[454][0] - landmarks[234][0]);
    const [x, y] = landmarks[imageSide === "left" ? 234 : 454];
    const size = Math.round(faceW * 0.45);
    const sx = Math.max(0, Math.min(image.width - size, Math.round(x - size / 2)));
    const sy = Math.max(0, Math.min(image.height - size, Math.round(y - size * 0.2)));
    const src = Object.assign(document.createElement("canvas"), { width: image.width, height: image.height });
    src.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
    c.width = 360;
    c.height = 360;
    c.getContext("2d")!.drawImage(src, sx, sy, size, size, 0, 0, 360, 360);
  }, [image, landmarks, imageSide]);
  return (
    <figure>
      <canvas ref={ref} className="w-full rounded-xl" role="img" aria-label={label} />
      <figcaption className="mt-1 text-sm font-semibold">{label}</figcaption>
    </figure>
  );
}

export default function Earrings() {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [goldOn, setGoldOn] = useState<Side>("left");
  const [result, setResult] = useState<PixelBuffer | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const onPhoto = async (p: PreparedPhoto) => {
    setPhoto(p);
    setResult(null);
    setBusy("Reading your undertone…");
    setError("");
    try {
      const prof = await getProfile(p.blob);
      setProfile(prof);
      await settings.set("skinProfile", { ...prof, at: new Date().toISOString() });
    } catch {
      setProfile(null); // The hint is optional; the try-on still works.
    } finally {
      setBusy("");
    }
  };

  const run = async () => {
    if (!photo) return;
    setBusy("Putting gold on one ear and silver on the other…");
    setError("");
    setSaved(false);
    try {
      setResult(await runEarrings(photo.blob, goldOn));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The try-on failed.");
    } finally {
      setBusy("");
    }
  };


  return (
    <AppShell back="/preview" title="Gold or silver?">
      <p className="mt-1 text-muted">Earrings come in pairs, so this is the most natural split: one gold hoop on one ear, one silver hoop on the other, same light, same photo.</p>
      <div className="mt-4">{!photo && <PhotoPicker onReady={onPhoto} label="Take a photo with both ears visible" />}</div>

      {photo && !result && !busy && (
        <Panel className="mt-3">
          {profile && <p>{metalHint(skinUndertone(profile.skinColor))}</p>}
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Gold goes on your…</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["left", "right"] as const).map((s) => (
                <button key={s} aria-pressed={goldOn === s} onClick={() => setGoldOn(s)} className={`min-h-11 rounded-xl border font-medium ${goldOn === s ? "border-ink bg-ink text-white" : "border-line"}`}>
                  {s} ear
                </button>
              ))}
            </div>
          </fieldset>
          <Button className="mt-4 w-full" onClick={run}>
            Try both metals
          </Button>
          <p className="mt-2 text-xs text-muted">Hoop photos: The Metropolitan Museum of Art, CC0; the silver one is the same hoop recoloured so only the metal differs.</p>
        </Panel>
      )}

      {busy && <p className="mt-4 text-muted" role="status">{busy}</p>}
      {error && <p className="mt-4 rounded-xl bg-stop-soft p-3 text-sm text-stop" role="alert">{error}</p>}

      {photo && result && (
        <div className="mt-3 space-y-3">
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Side by side</h2>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold">Preview: simulated</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {/* The user's left ear is the image's right side of an un-mirrored photo; shown on screen-left like a mirror. */}
              <EarCrop image={result} landmarks={photo.landmarks} imageSide="right" label={`${goldOn === "left" ? "Gold" : "Silver"} · your left ear`} />
              <EarCrop image={result} landmarks={photo.landmarks} imageSide="left" label={`${goldOn === "left" ? "Silver" : "Gold"} · your right ear`} />
            </div>
            {profile && <p className="mt-3 text-sm text-muted">{metalHint(skinUndertone(profile.skinColor))}</p>}
          </Panel>
          <Button
            className="w-full"
            disabled={saved}
            onClick={async () => {
              await previews.put({ id: newId(), kind: "earrings", createdAt: new Date().toISOString(), title: "Gold vs silver", image: await bufferToBlob(result) });
              setSaved(true);
            }}
          >
            {saved ? "Saved to your previews" : "Save this preview"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => (setGoldOn(goldOn === "left" ? "right" : "left"), setResult(null))}>
            Swap the metals and try again
          </Button>
        </div>
      )}
    </AppShell>
  );
}
