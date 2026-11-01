"use client";
import { useEffect } from "react";
import "@/components/InstallPrompt"; // Registers beforeinstallprompt early, on any route.

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
