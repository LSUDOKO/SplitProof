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
import { HAIR_SWATCH, hairShortlist } from "@/lib/preview/hair";
import { skinUndertone } from "@/lib/preview/shades";
import { fitMidline } from "@/lib/split/midline";
import type { PixelBuffer } from "@/lib/types";

export default function HairColour() {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [composite, setComposite] = useState<PixelBuffer | null>(null);
  const [saved, setSaved] = useState(false);

  const onPhoto = async (p: PreparedPhoto) => {
    setPhoto(p);
    setComposite(null);
    setBusy("Reading your skin tone and hair colour…");
    setError("");
    try {
      const prof = await getProfile(p.blob);
      setProfile(prof);
      await settings.set("skinProfile", { ...prof, at: new Date().toISOString() });
      setPicked([hairShortlist(skinUndertone(prof.skinColor), prof.hairColorName)[0].preset]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read this photo.");
    } finally {
      setBusy("");
    }
  };

  const toggle = (preset: string) => setPicked((cur) => (cur.includes(preset) ? cur.filter((c) => c !== preset) : [...cur, preset].slice(-2)));

  const run = async () => {
    if (!photo || !picked.length) return;
    setBusy("Colouring half of your hair…");
    setError("");
    setSaved(false);
    try {
      const tries = await Promise.all(picked.map((preset) => runImageTask("hair-color", photo.blob, { preset })));
      setComposite(splitComposite(photo.width, photo.height, fitMidline(photo.landmarks), { left: tries[0], right: tries[1] ?? photo.pixels }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The preview failed.");
    } finally {
      setBusy("");
    }
  };

  const reset = () => {
    setPhoto(null);
    setProfile(null);
    setComposite(null);
    setError("");
  };

  const suggestions = profile ? hairShortlist(skinUndertone(profile.skinColor), profile.hairColorName) : [];
  const current = profile?.hairColorName ? `Current (${profile.hairColorName.toLowerCase()})` : "Current colour";

  return (
    <AppShell back="/preview" title="Hair colour">
      <p className="mt-1 text-ink/70">A strand test for your whole look: the new colour on the left half of your head, your current hair on the right.</p>

      {!photo && (
        <div className="mt-4">
          <PhotoPicker onReady={onPhoto} label="Take a photo with your hair visible" />
        </div>
      )}

      {photo && busy && (
        <div className="mt-4">
          <WorkingPhoto photo={photo.pixels} message={busy} />
        </div>
      )}

      {photo && profile && !composite && !busy && (
        <Panel className="mt-4">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-full ring-2 ring-raised" style={{ background: profile.skinColor }} aria-hidden="true" />
            {profile.hairColor && <span className="h-11 w-11 shrink-0 rounded-full ring-2 ring-raised" style={{ background: profile.hairColor }} aria-hidden="true" />}
            <p className="text-sm">
              {skinUndertone(profile.skinColor)} undertone
              {profile.hairColorName && <span className="block text-ink/70">Hair now: {profile.hairColorName.toLowerCase()}</span>}
            </p>
          </div>
          <h2 className="mt-5 text-lg font-normal">Suggested for you</h2>
          <ul className="mt-2 space-y-2">
            {suggestions.map((s) => (
              <li key={s.preset}>
                <button aria-pressed={picked.includes(s.preset)} onClick={() => toggle(s.preset)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.98] ${picked.includes(s.preset) ? "bg-raised ring-2 ring-ink" : "bg-raised/60"}`}>
                  <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full" style={{ background: HAIR_SWATCH[s.preset] }} aria-hidden="true" />
                  <span>
                    {s.preset}
                    <span className="block text-sm text-ink/70">{s.why}</span>
                    {s.note && (
                      <span className="mt-1 flex items-baseline gap-1.5 text-sm">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-control" aria-hidden="true" />
                        {s.note}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <h2 className="mt-5 text-lg font-normal">All colours</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(HAIR_SWATCH).map(([name, hex]) => (
              <button key={name} aria-pressed={picked.includes(name)} onClick={() => toggle(name)} className={`flex min-h-11 items-center gap-2 rounded-full px-3 text-sm transition-transform active:scale-[0.97] ${picked.includes(name) ? "bg-forest-deep text-white" : "bg-raised"}`}>
                <span className="h-4 w-4 rounded-full ring-1 ring-ink/20" style={{ background: hex }} aria-hidden="true" />
                {name}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" disabled={!picked.length} onClick={run}>
            {picked.length === 2 ? `Compare ${picked[0]} and ${picked[1]}` : picked.length ? `Try ${picked[0]} on half` : "Pick a colour"}
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

      {photo && composite && (
        <div className="mt-4 space-y-3">
          <SplitPreview image={composite} before={photo.pixels} landmarks={photo.landmarks} leftLabel={picked[0]} rightLabel={picked[1] ?? current} />
          <Reveal delay={0.9} stagger={0.12} className="space-y-3">
            <Button
              className="w-full"
              disabled={saved}
              onClick={async () => {
                await previews.put({ id: newId(), kind: "hair", createdAt: new Date().toISOString(), title: `${picked[0]} vs ${picked[1] ?? "current"}`, image: await bufferToBlob(composite) });
                setSaved(true);
              }}
            >
              {saved ? "Saved to your previews" : "Save this preview"}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setComposite(null)}>
              Try other colours
            </Button>
            <button className="min-h-11 w-full text-sm underline underline-offset-4" onClick={reset}>
              Use another photo
            </button>
          </Reveal>
        </div>
      )}
    </AppShell>
  );
}
