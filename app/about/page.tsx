import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "How accurate is it?" };

const SECTIONS = [
  {
    title: "What gets measured",
    body: "YouCam AI Skin Analysis returns a detection map for each concern (acne, redness, pores and so on). SplitSide finds the middle of your face from 478 face landmarks, builds two mirror-image cheek areas of exactly the same size, and measures how much of each area the concern covers.",
  },
  {
    title: "Why it beats before-and-after",
    body: "Both halves are in the same photo, taken in the same light, after the same night's sleep. Anything that affects your whole face cancels out when the treated side is compared with the control side.",
  },
  {
    title: "Your personal noise range",
    body: "Your two cheeks are never identical, and every photo is a little different. Three baseline scans measure that wobble. A change only counts as real when it is bigger than your own noise range on two scans in a row.",
  },
  {
    title: "What can still fool it",
    body: "Light from one side (the Light Balance Gate blocks it), product spreading across the middle (a band down the middle is ignored), and natural differences between your cheeks (the baseline removes them). Missed applications weaken the result, which lowers the confidence shown.",
  },
  {
    title: "What it is not",
    body: "SplitSide measures how your skin appears on photos. It is a cosmetic decision tool, not a medical device, and it does not diagnose or treat anything. If a product burns, stings or causes swelling, stop using it and see a doctor if it is painful, spreading or not settling.",
  },
];

export default function About() {
  return (
    <AppShell back="/settings" title="How accurate is it?">
      <div className="mt-2 space-y-3">
        {SECTIONS.map((s) => (
          <Panel key={s.title}>
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-2 text-muted">{s.body}</p>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
