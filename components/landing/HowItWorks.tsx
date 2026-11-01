import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { FaceLineArt, ScannerFrame } from "@/components/ScannerFrame";
import { SplitFace } from "@/components/SplitFace";
import { H2, LEDE, SECTION, Tag, VerdictPills } from "./kit";
import { ScrollRail } from "./ScrollRail";

const CHECKS = ["Face centred", "Even light", "Still"];

const STEPS: { when: string; title: string; body: string; art: ReactNode }[] = [
  {
    when: "Day 1",
    title: "One side",
    body: "Tell SplitSide what you're testing and what it should improve. It flips a coin to pick the cheek. The product goes there only, and three baseline scans record how your two cheeks already differ.",
    art: (
      <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
        <SplitFace size={92} treatedSide="left" labels={false} />
        <div className="flex flex-col items-start gap-2">
          <Tag tone="treated" dot="treated" small>Left: product</Tag>
          <Tag tone="control" dot="control" small>Right: nothing</Tag>
        </div>
      </div>
    ),
  },
  {
    when: "Every two days",
    title: "Same photo",
    body: "Take one guided selfie. Photos lit from one side are rejected before they count. YouCam AI Skin Analysis maps each concern, and SplitSide measures that map on both halves of the same photo.",
    art: (
      <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
        <div className="w-24 shrink-0">
          <ScannerFrame live>
            <FaceLineArt />
          </ScannerFrame>
        </div>
        <ul className="flex flex-col items-start gap-2">
          {CHECKS.map((c) => (
            <li key={c}>
              <Tag tone="good" small>
                <Check size={14} aria-hidden="true" />
                {c}
              </Tag>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    when: "End of the trial",
    title: "Real answer",
    body: "Statistics decide, not a chatbot's guess. You get a plain answer with a confidence level and, if it isn't working, a return request drafted before the return window closes.",
    art: <VerdictPills className="w-full max-w-[15rem]" />,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className={SECTION}>
      <Reveal scroll>
        <h2 id="how-title" className={H2}>
          How a trial works
        </h2>
        <p className={LEDE}>One selfie every two days. Hydration trials run about a week; acne and redness about two.</p>
      </Reveal>
      <div className="relative mt-10 lg:mt-14">
        <span aria-hidden="true" className="absolute bottom-6 left-[1.09rem] top-6 border-l border-dashed border-ink/25 lg:left-[1.34rem]" />
        <ScrollRail className="absolute bottom-6 left-[1.09rem] top-6 w-px bg-forest lg:left-[1.34rem]" />
        <ol className="relative space-y-4 lg:space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2.5 lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:gap-6">
              <span className="sticky top-20 flex h-9 w-9 items-center justify-center self-start rounded-full bg-raised font-light shadow-[var(--shadow-soft)] lg:h-11 lg:w-11 lg:text-lg" aria-hidden="true">
                {i + 1}
              </span>
              <Reveal scroll className="rounded-panel bg-card p-5 shadow-[var(--shadow-soft)] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:p-8">
                <div>
                  <p className="text-sm text-ink/70">{s.when}</p>
                  <h3 className="mt-1 text-2xl font-light tracking-[-0.01em] lg:text-3xl">{s.title}</h3>
                  <p className="mt-2 text-ink/80 text-pretty">{s.body}</p>
                </div>
                <div className="mt-5 flex justify-center lg:mt-0">{s.art}</div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
