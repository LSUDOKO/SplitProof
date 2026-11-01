"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { PhotoPicker } from "@/components/PhotoPicker";
import { WorkingPhoto } from "@/components/SplitPreview";
import { Button, Panel } from "@/components/ui";
import { newId, previews, settings } from "@/lib/db";
import { bufferToBlob, getProfile, runEarrings, type PreparedPhoto, type SkinProfile } from "@/lib/preview/client";
import { metalHint, type Metal } from "@/lib/preview/earrings";
import { skinUndertone } from "@/lib/preview/shades";
import type { Landmarks, PixelBuffer, Side } from "@/lib/types";

function Hoop({ metal, size }: { metal: Metal; size: number }) {
  return <Image src={`/preview/hoop-${metal}.png`} alt="" width={size} height={size} />;
}

/** Close-up of one ear: below the face-contour landmark (234 = image-left, 454 = image-right). */
function EarCrop({ image, landmarks, imageSide, metal, label }: { image: PixelBuffer; landmarks: Landmarks; imageSide: "left" | "right"; metal: Metal; label: string }) {
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
      <canvas ref={ref} className="aspect-square w-full rounded-2xl bg-night" role="img" aria-label={label} />
      <figcaption className="mt-2 flex items-center gap-1.5 text-sm">
        <Hoop metal={metal} size={20} />
        {label}
      </figcaption>
    </figure>
  );
}

/** The two ears pop in one after the other, gold and silver sharing the same photo. */
function EarPair({ image, landmarks, goldOn }: { image: PixelBuffer; landmarks: Landmarks; goldOn: Side }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("figure", { scale: 0.88, autoAlpha: 0, duration: 0.7, stagger: 0.18, delay: 0.15, ease: "back.out(1.6)" });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const leftMetal: Metal = goldOn === "left" ? "gold" : "silver";
  const rightMetal: Metal = goldOn === "left" ? "silver" : "gold";
  const word = (m: Metal) => (m === "gold" ? "Gold" : "Silver");
  return (
    <div ref={root} className="mt-3 grid grid-cols-2 gap-3">
      {/* The user's left ear is the image's right side of an un-mirrored photo; shown on screen-left like a mirror. */}
      <EarCrop image={image} landmarks={landmarks} imageSide="right" metal={leftMetal} label={`${word(leftMetal)} · your left ear`} />
      <EarCrop image={image} landmarks={landmarks} imageSide="left" metal={rightMetal} label={`${word(rightMetal)} · your right ear`} />
    </div>
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

  const reset = () => {
    setPhoto(null);
    setProfile(null);
    setResult(null);
    setError("");
  };

  return (
    <AppShell back="/preview" title="Gold or silver?">
      <p className="mt-1 text-ink/70">Earrings come in pairs, so this is the most natural split: one gold hoop on one ear, one silver hoop on the other, same light, same photo.</p>

      {!photo && (
        <div className="mt-4">
          <PhotoPicker onReady={onPhoto} label="Take a photo with both ears visible" />
        </div>
      )}

      {photo && busy && (
        <div className="mt-4">
          <WorkingPhoto photo={photo.pixels} message={busy} />
        </div>
      )}

      {photo && !result && !busy && (
        <Panel className="mt-4">
          {profile && <p className="mb-4">{metalHint(skinUndertone(profile.skinColor))}</p>}
          <fieldset>
            <legend className="text-lg">Gold goes on your…</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["left", "right"] as const).map((s) => (
                <button key={s} aria-pressed={goldOn === s} onClick={() => setGoldOn(s)} className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-transform active:scale-[0.97] ${goldOn === s ? "bg-forest-deep text-white" : "bg-raised"}`}>
                  <Hoop metal={goldOn === s ? "gold" : "silver"} size={56} />
                  {s} ear
                </button>
              ))}
            </div>
          </fieldset>
          <Button className="mt-4 w-full" onClick={run}>
            Try both metals
          </Button>
          <button className="mt-2 min-h-11 w-full text-sm underline underline-offset-4" onClick={reset}>
            Use another photo
          </button>
          <p className="mt-2 text-xs text-ink/70">Hoop photos: The Metropolitan Museum of Art, CC0; the silver one is the same hoop recoloured so only the metal differs.</p>
        </Panel>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-stop-soft p-3 text-sm text-stop" role="alert">
          {error}
        </p>
      )}

      {photo && result && (
        <div className="mt-4">
          <Reveal stagger={0.12} className="space-y-3">
            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-normal">Side by side</h2>
                <span className="shrink-0 rounded-full bg-raised px-2.5 py-1 text-xs font-medium">Preview: simulated</span>
              </div>
              <EarPair image={result} landmarks={photo.landmarks} goldOn={goldOn} />
              {profile && <p className="mt-3 text-sm text-ink/70">{metalHint(skinUndertone(profile.skinColor))}</p>}
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
          </Reveal>
        </div>
      )}
    </AppShell>
  );
}
