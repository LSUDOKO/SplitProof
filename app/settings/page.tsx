"use client";
import { ArrowUpRight, Coins, Database, Info, Sun, User, Volume2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { setVoiceEnabled, speak, voiceEnabled, voiceSupported } from "@/lib/capture/voice";
import { deleteEverything, scans, settings, trials } from "@/lib/db";
import { loadDemo } from "@/lib/demo/load";

/** `Button variant="danger"` is white on a light red in the dark theme, 2.35:1; paper clears 4.5 in both. */
const DANGER = "inline-flex min-h-12 items-center justify-center rounded-full bg-stop px-6 font-medium text-paper transition-transform active:scale-[0.97]";

const neverChanges = () => () => {};

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-normal">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raised" aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      {children}
    </h2>
  );
}

function ProfileForm() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    settings.get<string>("userName").then((n) => alive && n && setName(n));
    return () => {
      alive = false;
    };
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    await settings.set("userName", name.trim());
    setSaved(true);
  };
  return (
    <form onSubmit={save} className="mt-3">
      <Field label="Your name">
        <input
          className={`${inputClass} placeholder:text-ink/70!`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="What should we call you?"
          autoComplete="given-name"
          maxLength={60}
        />
      </Field>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" variant="secondary">
          Save name
        </Button>
        {saved && (
          <p className="text-sm text-good" role="status">
            Saved
          </p>
        )}
      </div>
    </form>
  );
}

function VoiceToggle() {
  const supported = useSyncExternalStore(neverChanges, voiceSupported, () => false);
  const saved = useSyncExternalStore(neverChanges, voiceEnabled, () => false);
  const [choice, setChoice] = useState<boolean | null>(null);
  return (
    <label className={`mt-2 flex min-h-11 items-center justify-between gap-4 ${supported ? "cursor-pointer" : ""}`}>
      <span className="min-w-0 text-sm text-ink/70">{supported ? "Speaks the scanner's tips, so you can keep looking at the camera." : "This browser can't speak, so tips stay on screen."}</span>
      <input
        type="checkbox"
        role="switch"
        aria-label="Voice guidance"
        className="peer sr-only"
        checked={choice ?? saved}
        disabled={!supported}
        onChange={(e) => {
          setVoiceEnabled(e.target.checked);
          setChoice(e.target.checked);
          if (e.target.checked) speak("Voice guidance is on.");
        }}
      />
      <span
        className="relative h-8 w-14 shrink-0 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-paper after:transition-transform peer-checked:bg-forest peer-checked:after:translate-x-6 peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest peer-disabled:opacity-40"
        aria-hidden="true"
      />
    </label>
  );
}

export default function Settings() {
  const router = useRouter();
  const [units, setUnits] = useState<string>("…");
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setUnits(d.configured ? `${d.units} units` : "API key not set"))
      .catch(() => setUnits("unavailable"));
  }, []);

  const exportJson = async () => {
    const all = await trials.all();
    const data = await Promise.all(all.map(async (t) => ({ trial: t, scans: await scans.forTrial(t.id) })));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: "splitside-export.json" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <h1 className="mt-2 text-[1.7rem] font-normal tracking-tight">Settings</h1>

      <Panel className="mt-5">
        <SectionTitle icon={User}>Profile</SectionTitle>
        <ProfileForm />
      </Panel>

      <Panel className="mt-3">
        <SectionTitle icon={Sun}>Appearance</SectionTitle>
        <div className="mt-3">
          <ThemeSegmented />
        </div>
      </Panel>

      <Panel className="mt-3">
        <SectionTitle icon={Volume2}>Voice guidance</SectionTitle>
        <VoiceToggle />
      </Panel>

      <Panel className="mt-3">
        <SectionTitle icon={Database}>Your data</SectionTitle>
        <p className="mt-2 text-sm text-ink/70">Photos, masks and results live only in this browser.</p>
        <div className="mt-4 flex flex-col gap-3">
          <Button variant="secondary" onClick={exportJson}>Export trials (JSON, no photos)</Button>
          <Button variant="secondary" onClick={async () => (await loadDemo(), setMsg("Demo trials reloaded."))}>Reload demo trials</Button>
          {!confirm ? (
            <button className={DANGER} onClick={() => setConfirm(true)}>Delete everything</button>
          ) : (
            <div className="rounded-2xl bg-stop-soft p-4">
              <p className="text-stop">This permanently deletes every trial, photo and result on this device.</p>
              <div className="mt-3 flex gap-2">
                <button className={`${DANGER} flex-1`} onClick={async () => (await deleteEverything(), router.push("/"))}>Delete</button>
                <Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {msg && <p className="text-sm text-good" role="status">{msg}</p>}
        </div>
      </Panel>

      <Panel className="mt-3">
        <SectionTitle icon={Coins}>YouCam API units</SectionTitle>
        <p className="mt-2 text-2xl font-light tabular-nums">{units}</p>
        <p className="mt-1 text-sm text-ink/70">Each scan uses 16 units (8 HD concerns). Units are charged only when an analysis succeeds.</p>
      </Panel>

      <InstallPrompt />

      <Panel className="mt-3">
        <SectionTitle icon={Info}>About</SectionTitle>
        <Link href="/about" className="mt-2 flex min-h-11 items-center justify-between gap-3">
          How accurate is SplitSide?
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </Link>
        <p className="mt-2 text-sm text-ink/70">SplitSide is a cosmetic decision tool, not a medical device. If a product hurts, stop using it and see a doctor.</p>
        <p className="mt-2 text-sm text-ink/70">Skin measurements by YouCam AI Skin Analysis (Perfect Corp). Previews are simulations, never measurements.</p>
      </Panel>
    </AppShell>
  );
}
