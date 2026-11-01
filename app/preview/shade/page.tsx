"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PhotoPicker } from "@/components/PhotoPicker";
import { SplitPreview } from "@/components/SplitPreview";
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

  const shortlist = profile ? shortlistShades(profile.skinColor) : [];
  const best = result && result.seams.length === 2 ? [...result.seams].sort((a, b) => a.seam.deltaE - b.seam.deltaE)[0] : null;

  return (
    <AppShell back="/preview" title="Shade swatch">
      <p className="mt-1 text-muted">Makeup artists check a foundation on the jaw next to bare skin. This does the same on your photo: the shade on your left half, bare skin or a second shade on your right.</p>

      <div className="mt-4">{!photo ? <PhotoPicker onReady={onPhoto} /> : null}</div>

      {photo && profile && !result && (
        <Panel className="mt-3">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full border border-line" style={{ background: profile.skinColor }} aria-hidden="true" />
            <div>
              <p className="font-semibold">Your skin tone, measured on this photo</p>
              <p className="text-sm text-muted">{skinUndertone(profile.skinColor)} undertone · Fitzpatrick type {profile.fitzpatrick}</p>
            </div>
          </div>
          <h2 className="mt-5 font-semibold">Pick one shade, or two to compare</h2>
          <p className="text-sm text-muted">Closest to your skin first.</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {(showAll ? SHADES : shortlist).map((s) => {
              const on = picked.some((p) => p.id === s.id);
              return (
                <li key={s.id}>
                  <button aria-pressed={on} onClick={() => toggle(s)} className={`w-full rounded-xl border p-2 text-left text-xs font-medium ${on ? "border-ink ring-2 ring-ink" : "border-line"}`}>
                    <span className="mb-1.5 block h-8 rounded-lg" style={{ background: s.hex }} aria-hidden="true" />
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="mt-3 text-sm font-medium underline underline-offset-4" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show my closest shades" : "Show all 24 shades"}
          </button>
          <Button className="mt-4 w-full" disabled={!picked.length || !!busy} onClick={run}>
            {picked.length === 2 ? `Compare ${picked[0].name} and ${picked[1].name}` : picked.length ? `Try ${picked[0].name} next to bare skin` : "Pick a shade"}
          </Button>
        </Panel>
      )}

      {busy && <p className="mt-4 text-muted" role="status">{busy}</p>}
      {error && (
        <p className="mt-4 rounded-xl bg-stop-soft p-3 text-sm text-stop" role="alert">
          {error}
        </p>
      )}

      {photo && result && (
        <div className="mt-3 space-y-3">
          <SplitPreview image={result.composite} landmarks={photo.landmarks} leftLabel={picked[0].name} rightLabel={picked[1]?.name ?? "Bare skin"} />
          <Panel>
            <h2 className="font-semibold">How well it blends</h2>
            <ul className="mt-2 space-y-2">
              {result.seams.map(({ shade, seam }) => (
                <li key={shade.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full" style={{ background: shade.hex }} aria-hidden="true" />
                    {shade.name}
                  </span>
                  <span className={`font-semibold ${seam.verdict === "blends" ? "text-good" : seam.verdict.startsWith("too") ? "text-stop" : "text-control"}`}>
                    {SEAM_LABELS[seam.verdict]}
                  </span>
                </li>
              ))}
            </ul>
            {best && <p className="mt-3">Pick {best.shade.name}: it changes your skin colour least, so the edge at your jaw will show less.</p>}
            <p className="mt-3 text-xs text-muted">Estimate on a simulated image (colour difference ΔE between your bare cheeks and the same cheeks with the shade). Real daylight can look different.</p>
          </Panel>
          <div className="flex flex-col gap-3">
            <Button onClick={save} disabled={saved}>
              {saved ? "Saved to your previews" : "Save this preview"}
            </Button>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Try other shades
            </Button>
            <Button variant="ghost" onClick={() => (setPhoto(null), setProfile(null), setResult(null))}>
              Use another photo
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
