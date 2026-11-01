"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { PhotoPicker } from "@/components/PhotoPicker";
import { SplitPreview, WorkingPhoto } from "@/components/SplitPreview";
import { Button, Panel } from "@/components/ui";
import { newId, previews, settings } from "@/lib/db";
import { bufferToBlob, getProfile, runImageTask, type PreparedPhoto, type SkinProfile } from "@/lib/preview/client";
import { splitComposite } from "@/lib/preview/composite";
import { SEAM_LABELS, seamScore, type Seam } from "@/lib/preview/seam";
import { SHADES, shortlistShades, skinUndertone, type Shade } from "@/lib/preview/shades";
import { fitMidline } from "@/lib/split/midline";
import { buildRoiIndex, faceGeometry } from "@/lib/split/rois";
import type { PixelBuffer } from "@/lib/types";

const foundation = (hex: string) => ({
  version: "1.0",
  effects: [{ category: "foundation", palettes: [{ color: hex, colorIntensity: 70, glowIntensity: 30, coverageIntensity: 70 }] }],
});

interface Result {
  composite: PixelBuffer;
  seams: { shade: Shade; seam: Seam }[];
}

/** Ink text with a coloured dot: the coloured text tokens miss 4.5:1 on a light card. */
function SeamChip({ seam }: { seam: Seam }) {
  const dot = seam.verdict === "blends" ? "bg-good" : seam.verdict.startsWith("too") ? "bg-stop" : "bg-control";
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-sm">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {SEAM_LABELS[seam.verdict]}
    </span>
  );
}

export default function ShadeSwatch() {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [picked, setPicked] = useState<Shade[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  const onPhoto = async (p: PreparedPhoto) => {
    setPhoto(p);
    setResult(null);
    setPicked([]);
    setBusy("Reading your skin tone…");
    setError("");
    try {
      const prof = await getProfile(p.blob);
      setProfile(prof);
      await settings.set("skinProfile", { ...prof, at: new Date().toISOString() });
      setPicked(shortlistShades(prof.skinColor, 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read your skin tone.");
    } finally {
      setBusy("");
    }
  };

  const toggle = (s: Shade) =>
    setPicked((cur) => (cur.some((c) => c.id === s.id) ? cur.filter((c) => c.id !== s.id) : [...cur, s].slice(-2)));

  const run = async () => {
    if (!photo || !picked.length) return;
    setBusy(picked.length === 2 ? "Trying both shades…" : "Trying the shade…");
    setError("");
    setSaved(false);
    try {
      const tries = await Promise.all(picked.map((s) => runImageTask("makeup-vto", photo.blob, foundation(s.hex))));
      const roi = buildRoiIndex(photo.width, photo.height, faceGeometry(photo.landmarks, "cheeks"));
      const seams = picked.map((shade, i) => ({ shade, seam: seamScore(photo.pixels, tries[i], roi) }));
      const composite = splitComposite(photo.width, photo.height, fitMidline(photo.landmarks), { left: tries[0], right: tries[1] ?? photo.pixels });
      setResult({ composite, seams });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The preview failed.");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!result) return;
    await previews.put({
      id: newId(),
      kind: "shade",
      createdAt: new Date().toISOString(),
      title: picked.map((s) => s.name).join(" vs ") + (picked.length === 1 ? " vs bare" : ""),
      image: await bufferToBlob(result.composite),
      note: result.seams.map((s) => `${s.shade.name}: ${SEAM_LABELS[s.seam.verdict]} (ΔE ${s.seam.deltaE})`).join("; "),
    });
    setSaved(true);
  };

  const reset = () => {
    setPhoto(null);
    setProfile(null);
    setResult(null);
    setError("");
  };

  const shortlist = profile ? shortlistShades(profile.skinColor) : [];
  const best = result && result.seams.length === 2 ? [...result.seams].sort((a, b) => a.seam.deltaE - b.seam.deltaE)[0] : null;

  return (
    <AppShell back="/preview" title="Shade swatch">
      <p className="mt-1 text-ink/70">Makeup artists check a foundation on the jaw next to bare skin. This does the same on your photo: the shade on your left half, bare skin or a second shade on your right.</p>

      {!photo && (
        <div className="mt-4">
          <PhotoPicker onReady={onPhoto} />
        </div>
      )}

      {photo && busy && (
        <div className="mt-4">
          <WorkingPhoto photo={photo.pixels} message={busy} />
        </div>
      )}

      {photo && profile && !result && !busy && (
        <Panel className="mt-4">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-full ring-2 ring-raised" style={{ background: profile.skinColor }} aria-hidden="true" />
            <div>
              <p>Your skin tone on this photo</p>
              <p className="text-sm text-ink/70">
                {skinUndertone(profile.skinColor)} undertone · Fitzpatrick type {profile.fitzpatrick}
              </p>
            </div>
          </div>
          <h2 className="mt-5 text-lg font-normal">Pick one shade, or two to compare</h2>
          <p className="text-sm text-ink/70">Closest to your skin first.</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {(showAll ? SHADES : shortlist).map((s) => {
              const on = picked.some((p) => p.id === s.id);
              return (
                <li key={s.id}>
                  <button aria-pressed={on} onClick={() => toggle(s)} className={`h-full w-full rounded-2xl p-2 text-left text-xs transition-transform active:scale-[0.97] ${on ? "bg-raised ring-2 ring-ink" : "bg-raised/60"}`}>
                    <span className="mb-1.5 block h-10 rounded-xl" style={{ background: s.hex }} aria-hidden="true" />
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="mt-2 min-h-11 text-sm underline underline-offset-4" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show my closest shades" : "Show all 24 shades"}
          </button>
          <Button className="mt-2 w-full" disabled={!picked.length} onClick={run}>
            {picked.length === 2 ? `Compare ${picked[0].name} and ${picked[1].name}` : picked.length ? `Try ${picked[0].name} next to bare skin` : "Pick a shade"}
          </Button>
        </Panel>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-stop-soft p-3 text-sm text-stop" role="alert">
          {error}
        </p>
      )}
      {photo && !profile && !busy && (
        <Button variant="secondary" className="mt-3 w-full" onClick={reset}>
          Use another photo
        </Button>
      )}

      {photo && result && (
        <div className="mt-4 space-y-3">
          <SplitPreview image={result.composite} before={photo.pixels} landmarks={photo.landmarks} leftLabel={picked[0].name} rightLabel={picked[1]?.name ?? "Bare skin"} />
          <Reveal delay={0.9} stagger={0.12} className="space-y-3">
            <Panel>
              <h2 className="text-lg font-normal">How well it blends</h2>
              <ul className="mt-3 space-y-2">
                {result.seams.map(({ shade, seam }) => (
                  <li key={shade.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: shade.hex }} aria-hidden="true" />
                      {shade.name}
                    </span>
                    <SeamChip seam={seam} />
                  </li>
                ))}
              </ul>
              {best && <p className="mt-3">Pick {best.shade.name}: it changes your skin colour least, so the edge at your jaw will show less.</p>}
              <p className="mt-3 text-xs text-ink/70">Estimate on a simulated image (colour difference ΔE between your bare cheeks and the same cheeks with the shade). Real daylight can look different.</p>
            </Panel>
            <div className="flex flex-col gap-3">
              <Button onClick={save} disabled={saved}>
                {saved ? "Saved to your previews" : "Save this preview"}
              </Button>
              <Button variant="secondary" onClick={() => setResult(null)}>
                Try other shades
              </Button>
              <button className="min-h-11 text-sm underline underline-offset-4" onClick={reset}>
                Use another photo
              </button>
            </div>
          </Reveal>
        </div>
      )}
    </AppShell>
  );
}
