"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Panel } from "@/components/ui";
import { deleteEverything, scans, trials } from "@/lib/db";
import { loadDemo } from "@/lib/demo/load";

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
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Settings</h1>
      <Panel className="mt-5">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">Photos, masks and results live only in this browser.</p>
        <div className="mt-4 flex flex-col gap-3">
          <Button variant="secondary" onClick={exportJson}>Export trials (JSON, no photos)</Button>
          <Button variant="secondary" onClick={async () => (await loadDemo(), setMsg("Demo trials reloaded."))}>Reload demo trials</Button>
          {!confirm ? (
            <Button variant="danger" onClick={() => setConfirm(true)}>Delete everything</Button>
          ) : (
            <div className="rounded-xl bg-stop-soft p-4">
              <p className="font-semibold text-stop">This permanently deletes every trial, photo and result on this device.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" className="flex-1" onClick={async () => (await deleteEverything(), router.push("/"))}>Delete</Button>
                <Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {msg && <p className="text-sm text-good" role="status">{msg}</p>}
        </div>
      </Panel>
      <Panel className="mt-3">
        <h2 className="font-semibold">YouCam API units</h2>
        <p className="mt-1">{units}</p>
        <p className="mt-1 text-sm text-muted">Each scan uses 16 units (8 HD concerns). Units are charged only when an analysis succeeds.</p>
      </Panel>
      <Panel className="mt-3">
        <h2 className="font-semibold">About</h2>
        <ul className="mt-2 space-y-2">
          <li><Link className="underline underline-offset-4" href="/about">How accurate is SplitSide?</Link></li>
          <li className="text-sm text-muted">SplitSide is a cosmetic decision tool. It does not diagnose or treat any condition. If a product hurts, stop using it and see a doctor.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
