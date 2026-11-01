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
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-line bg-card p-6 text-center hover:border-ink/40">
        <Camera size={28} aria-hidden="true" />
        <span className="font-semibold">{busy ? "Finding your face…" : label}</span>
        <span className="text-sm text-muted">Face the light, hair off your face, neutral expression.</span>
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
      {error && <p className="mt-2 text-sm text-stop" role="alert">{error}</p>}
    </div>
  );
}
