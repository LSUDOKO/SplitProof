"use client";
import { Download } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button, Panel } from "./ui";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The browser fires this once per page load, so it only reaches this listener if the module is already
// loaded by then: import it from the root layout to catch it on any route, not just a direct /settings load.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const isStandalone = () => installed || matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPadOS reports itself as a Mac; only the touch points give it away.
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/** Settings section. The button exists only when the browser has handed over a real install prompt. */
export function InstallPrompt() {
  const event = useSyncExternalStore(subscribe, () => deferred, () => null);
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);
  const ios = useSyncExternalStore(subscribe, isIos, () => false);
  if (standalone) return null;

  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    deferred = null; // A prompt works once; the browser may offer another later.
    notify();
  };

  return (
    <Panel className="mt-3">
      <h2 className="flex items-center gap-3 text-lg font-normal">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raised" aria-hidden="true">
          <Download size={18} strokeWidth={1.8} />
        </span>
        Install app
      </h2>
      {event ? (
        <>
          <p className="mt-2 text-sm text-ink/70">Open SplitSide from your home screen, full screen, like any other app.</p>
          <Button className="mt-4 w-full" onClick={install}>
            Install SplitSide
          </Button>
        </>
      ) : ios ? (
        <p className="mt-2 text-sm text-ink/70">Tap the Share button in your browser, then Add to Home Screen.</p>
      ) : (
        <p className="mt-2 text-sm text-ink/70">Your browser hasn&apos;t offered an install yet. If its menu has Install app or Add to Home screen, that does the same thing.</p>
      )}
    </Panel>
  );
}
