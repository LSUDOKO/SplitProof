"use client";
import { Clock, MessageSquareText, ScanFace, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui";
import { settings } from "@/lib/db";

const POINTS = [
  { icon: ScanFace, text: "SplitSide analyses your face photos with YouCam AI by Perfect Corp to measure skin features on each side of your face." },
  { icon: Smartphone, text: "Your photos and results stay on this phone." },
  { icon: Clock, text: "Each photo is sent to YouCam only to be analysed; YouCam deletes results within 24 hours." },
  { icon: MessageSquareText, text: "The trial assistant only ever receives numbers and text, never photos." },
  { icon: Trash2, text: "You can delete everything at any time in Settings." },
  { icon: ShieldCheck, text: "SplitSide is a cosmetic decision tool, not a medical device. It measures how skin appears on your photos and can't assess any medical condition." },
];

export default function Consent() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    settings
      .get<string>("consentAt")
      .then((consent) => (consent ? router.replace("/trials") : setReady(true)))
      .catch(() => setReady(true));
  }, [router]);

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-lg px-5 pb-10">
      <header className="flex h-16 items-center">
        <Logo />
      </header>
      <main>
        <h1 className="mt-4 text-[2.4rem] font-light leading-[1.08] tracking-[-0.02em]">Before you start</h1>
        <p className="mt-2 text-lg text-ink/80">What happens to your photos, in plain words.</p>
        <Reveal as="ul" stagger={0.05} y={12} className="mt-6 space-y-2">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-[1.5rem] bg-card p-3 pr-4 shadow-[var(--shadow-soft)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="self-center">{text}</span>
            </li>
          ))}
        </Reveal>
        <label className="mt-5 flex min-h-14 cursor-pointer items-center gap-3 rounded-[1.5rem] bg-raised p-4 shadow-[var(--shadow-soft)]">
          <input type="checkbox" className="h-5 w-5 shrink-0 accent-forest" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="font-medium">I&apos;m 18 or older and I agree.</span>
        </label>
        {blocked && (
          <p className="mt-4 rounded-[1.5rem] bg-stop-soft p-4 text-ink" role="alert">
            This browser blocks on-device storage (private mode?). Open SplitSide in a normal tab.
          </p>
        )}
        <Button
          className="mt-5 w-full"
          disabled={!agreed}
          onClick={async () => {
            try {
              await settings.set("consentAt", new Date().toISOString());
              router.push("/trial/new");
            } catch {
              setBlocked(true);
            }
          }}
        >
          Continue
        </Button>
      </main>
    </div>
  );
}
