"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui";
import { settings } from "@/lib/db";

const POINTS = [
  "SplitSide analyses your face photos with YouCam AI by Perfect Corp to measure skin features on each side of your face.",
  "Your photos and results stay on this phone.",
  "Each photo is sent to YouCam only to be analysed; YouCam deletes results within 24 hours.",
  "The trial assistant only ever receives numbers and text, never photos.",
  "You can delete everything at any time in Settings.",
  "SplitSide is a cosmetic decision tool. It does not diagnose or treat any condition.",
];

export default function Consent() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="mx-auto max-w-md px-5 pb-12">
      <header className="flex h-16 items-center">
        <Logo />
      </header>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Before you start</h1>
      <ul className="mt-6 space-y-4">
        {POINTS.map((p) => (
          <li key={p} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-treated" aria-hidden="true" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <label className="mt-8 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-card p-4">
        <input type="checkbox" className="h-5 w-5 accent-ink" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span className="font-medium">I&apos;m 18 or older and I agree.</span>
      </label>
      <Button
        className="mt-6 w-full"
        disabled={!agreed}
        onClick={async () => {
          await settings.set("consentAt", new Date().toISOString());
          router.push("/trial/new");
        }}
      >
        Continue
      </Button>
    </div>
  );
}
