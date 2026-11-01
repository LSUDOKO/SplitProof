import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { SplitFace } from "@/components/SplitFace";
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "How accurate is it?" };

const STEPS = [
  {
    title: "Same photo, not before-and-after",
    body: "Both halves are in the same photo, taken in the same light, after the same night's sleep. Anything that affects your whole face cancels out when the treated side is compared with the control side.",
  },
  {
    title: "YouCam AI maps each concern",
    body: "YouCam AI Skin Analysis returns a detection map for each concern (acne, redness, pores and so on).",
  },
  {
    title: "Two equal areas",
    body: "SplitSide finds the middle of your face from 478 face landmarks, builds two mirror-image cheek areas of exactly the same size, and measures how much of each area the concern covers.",
  },
  {
    title: "Your personal noise range",
    body: "Your two cheeks are never identical, and every photo is a little different. Three baseline scans measure that wobble.",
  },
  {
    title: "Only real changes count",
    body: "A change only counts as real when it is bigger than your own noise range on two scans in a row.",
  },
];

const FOOLS = [
  { what: "Light from one side", guard: "the Light Balance Gate blocks it." },
  { what: "Product spreading across the middle", guard: "a band down the middle is ignored." },
  { what: "Natural differences between your cheeks", guard: "the baseline removes them." },
  { what: "Missed applications", guard: "they weaken the result, which lowers the confidence shown." },
];

export default function About() {
  return (
    <AppShell back="/settings" title="How accurate is it?">
      <div className="mt-1 flex justify-center">
        <SplitFace size={132} labels={false} />
      </div>

      <Panel className="mt-4">
        <h2 className="text-lg font-normal">From photo to verdict</h2>
        <Reveal as="ol" scroll stagger={0.1} className="mt-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[2.25rem_1fr] gap-3 pb-5 last:pb-0">
              {i < STEPS.length - 1 && <span className="absolute bottom-0 left-[1.0625rem] top-9 w-0.5 bg-line" aria-hidden="true" />}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-deep text-sm text-white" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3>{s.title}</h3>
                <p className="mt-1 text-sm text-ink/70">{s.body}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </Panel>

      <Panel className="mt-3">
        <h2 className="text-lg font-normal">What can still fool it</h2>
        <ul className="mt-3 space-y-2">
          {FOOLS.map((f) => (
            <li key={f.what} className="flex items-baseline gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-control" aria-hidden="true" />
              <span>
                {f.what}: <span className="text-ink/70">{f.guard}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-3" tone="control">
        <h2 className="text-lg font-normal">What it is not</h2>
        <p className="mt-2 text-sm">SplitSide measures how your skin appears on photos. It is a cosmetic decision tool, not a medical device. If a product burns, stings or causes swelling, stop using it and see a doctor if it is painful, spreading or not settling.</p>
        <p className="mt-2 text-sm">Previews are simulations, so they never count as measurements.</p>
      </Panel>
    </AppShell>
  );
}
