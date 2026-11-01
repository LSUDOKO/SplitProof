"use client";

const KEY = "splitside-voice";

export const voiceSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function voiceEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setVoiceEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Private mode: applies to this session only.
  }
  if (!on && voiceSupported()) speechSynthesis.cancel();
}

let last = "";
let lastAt = 0;

/** Spoken capture guidance (A10). Skips repeats within 4 s so a held pose doesn't nag. */
export function speak(text: string, now = Date.now()) {
  if (!voiceSupported() || !voiceEnabled()) return;
  if (text === last && now - lastAt < 4000) return;
  if (speechSynthesis.speaking && now - lastAt < 2000) return;
  last = text;
  lastAt = now;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
