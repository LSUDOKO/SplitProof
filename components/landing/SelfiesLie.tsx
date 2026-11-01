import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { H2, LEDE, SECTION } from "./kit";

const CHANGES = [
  ["Light", "Window", "Ceiling lamp"],
  ["Sleep", "8 hours", "5 hours"],
  ["Skin", "Just woke up", "Just washed"],
  ["Weather", "Humid", "Dry"],
  ["Product", "Not yet", "In use"],
];
const SHARED = ["Light", "Sleep", "Skin", "Weather"];

const Pill = ({ className, colSpan, children }: { className: string; colSpan?: number; children: ReactNode }) => (
  <td colSpan={colSpan} className="p-1">
    <span className={`block rounded-full px-1.5 py-1.5 text-center text-sm ${className}`}>{children}</span>
  </td>
);

/** Two small tables that make the point by shape: five rows that differ, then one. */
export function SelfiesLie() {
  return (
    <section aria-labelledby="selfies-title" className={SECTION}>
      <Reveal scroll>
        <h2 id="selfies-title" className={H2}>
          Why before-and-after selfies lie
        </h2>
        <p className={LEDE}>Compare Tuesday morning with Friday night and you&apos;re measuring the clock, the lamp and your sleep as much as the product.</p>
      </Reveal>

      <Reveal scroll stagger={0.12} className="mt-10 grid gap-3 lg:mt-14 lg:grid-cols-2 lg:gap-5">
        <div className="rounded-panel bg-card p-5 shadow-[var(--shadow-soft)] lg:p-8">
          <h3 className="text-2xl font-light tracking-[-0.01em]">Before and after</h3>
          <table className="mt-4 w-full table-fixed border-collapse">
            <caption className="sr-only">Two selfies on different days: everything differs between them.</caption>
            <thead>
              <tr>
                <td className="w-[3.4rem]" />
                <th scope="col" className="pb-1 text-center text-sm font-medium">Tuesday, 8 am</th>
                <th scope="col" className="pb-1 text-center text-sm font-medium">Friday, 9 pm</th>
              </tr>
            </thead>
            <tbody>
              {CHANGES.map(([row, a, b]) => (
                <tr key={row}>
                  <th scope="row" className="text-left text-sm font-normal text-ink/70">{row}</th>
                  <Pill className="bg-raised">{a}</Pill>
                  <Pill className="bg-raised">{b}</Pill>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-lg">Five things changed. Which one did it?</p>
        </div>

        <div className="rounded-panel bg-forest-deep p-5 text-white shadow-[var(--shadow-float)] lg:p-8">
          <h3 className="text-2xl font-light tracking-[-0.01em]">Split-face</h3>
          <table className="mt-4 w-full table-fixed border-collapse">
            <caption className="sr-only">Both cheeks in one photo: only the product differs between them.</caption>
            <thead>
              <tr>
                <td className="w-[3.4rem]" />
                <th scope="col" className="pb-1 text-center text-sm font-medium">Treated</th>
                <th scope="col" className="pb-1 text-center text-sm font-medium">Control</th>
              </tr>
            </thead>
            <tbody>
              {SHARED.map((row) => (
                <tr key={row}>
                  <th scope="row" className="text-left text-sm font-normal text-white/80">{row}</th>
                  <Pill colSpan={2} className="bg-current/15">Same on both sides</Pill>
                </tr>
              ))}
              <tr>
                <th scope="row" className="text-left text-sm font-normal text-white/80">Product</th>
                <Pill className="bg-treated-soft text-ink">In use</Pill>
                <Pill className="bg-control-soft text-ink">None</Pill>
              </tr>
            </tbody>
          </table>
          <p className="mt-5 text-lg">One thing changed. That&apos;s the product.</p>
        </div>
      </Reveal>

      <Reveal scroll className="mt-6">
        <p className="max-w-[60ch] text-ink/80 text-pretty">
          Dermatology research uses this same design, called a split-face trial. SplitSide brings it home.{" "}
          <Link href="/about" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
            How accurate is it?
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
