"use client";
import { Camera } from "lucide-react";
import { useState } from "react";
import { preparePhoto, type PreparedPhoto } from "@/lib/preview/client";

/**
 * Photo input for Preview mode. The phone opens the front camera; a gallery photo is fine here
 * because previews are simulations, never measurements.
 */
export function PhotoPicker({ onReady, label = "Take a front-facing photo" }: { onReady: (p: PreparedPhoto) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <label className="relative flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-line bg-card p-6 text-center shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-ink hover:border-ink/40">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-forest text-white shadow-[var(--shadow-float)] ${busy ? "motion-safe:[animation:breathe_1.4s_ease-in-out_infinite]" : ""}`}>
          <Camera size={26} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="text-lg" role={busy ? "status" : undefined}>
          {busy ? "Finding your face…" : label}
        </span>
        <span className="max-w-[28ch] text-sm text-ink/70">Face the light, hair off your face, neutral expression.</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="user"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              onReady(await preparePhoto(file));
            } catch (err) {
              setError(err instanceof Error ? err.message : "That photo didn't work. Try another.");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      {error && (
        <p className="mt-3 rounded-2xl bg-stop-soft p-3 text-sm text-stop" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
