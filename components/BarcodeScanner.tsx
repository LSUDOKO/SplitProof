"use client";
import { ScanBarcode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isBarcode, type ProductLookup } from "@/lib/integrations/openBeautyFacts";
import { Button, inputClass } from "./ui";

interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (o: { formats: string[] }) => Detector;
  }
}

/**
 * Barcode → product name and ingredients (Open Beauty Facts). Uses the native BarcodeDetector where
 * it exists (Android Chrome); typing the number works everywhere, and a miss never blocks the user.
 */
export function BarcodeScanner({ onFound }: { onFound: (p: ProductLookup) => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const canDetect = typeof window !== "undefined" && !!window.BarcodeDetector;

  const lookup = async (value: string) => {
    if (!isBarcode(value)) return setNote("Enter the 8 to 14 digits under the barcode.");
    setBusy(true);
    setNote("");
    try {
      const r: ProductLookup = await (await fetch(`/api/product/${value}`)).json();
      if (!r.found) setNote("Not in the open database yet. Type the product details below.");
      else {
        onFound(r);
        setNote(r.ingredients ? "Found it. Check the details below." : "Found the name, but no ingredient list. Paste it from the box if you can.");
        setOpen(false);
      }
    } catch {
      setNote("Couldn't reach the product database. Type the details below.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open || !canDetect) return;
    let stream: MediaStream | undefined;
    let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detector = new window.BarcodeDetector!({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        while (!stop) {
          const hits = await detector.detect(video.current).catch(() => []);
          if (hits[0]) {
            setCode(hits[0].rawValue);
            lookup(hits[0].rawValue);
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        setNote("Camera unavailable. Type the barcode number instead.");
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, canDetect]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-panel bg-card p-4 shadow-[var(--shadow-soft)]">
      <p className="flex items-center gap-2 font-medium">
        <ScanBarcode size={18} aria-hidden="true" />
        Fill in from the barcode
      </p>
      {open && canDetect && <video ref={video} playsInline muted className="mt-3 aspect-video w-full rounded-2xl bg-night object-cover" aria-label="Barcode camera" />}
      <div className="mt-3 flex gap-2">
        <input className={inputClass} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="Barcode number" aria-label="Barcode number" maxLength={14} />
        <Button variant="secondary" className="shrink-0 px-4" disabled={busy || !code} onClick={() => lookup(code)}>
          {busy ? "…" : "Look up"}
        </Button>
      </div>
      {canDetect && (
        <button className="mt-2 text-sm text-forest underline underline-offset-4" onClick={() => setOpen(!open)}>
          {open ? "Close camera" : "Scan with the camera"}
        </button>
      )}
      {note && <p className="mt-2 text-sm text-muted" role="status">{note}</p>}
      <p className="mt-2 text-xs text-muted">Product data from Open Beauty Facts, an open database.</p>
    </div>
  );
}
