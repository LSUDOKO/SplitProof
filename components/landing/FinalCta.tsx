import Link from "next/link";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { StartLink } from "./kit";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-5 pb-12 lg:px-8">
      <Reveal scroll className="grid items-center gap-6 overflow-hidden rounded-[2.25rem] bg-forest-deep p-7 text-white shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,1fr)_auto] lg:p-14">
        <div>
          <h2 id="cta-title" className="text-[2.2rem] font-light leading-[1.08] tracking-[-0.02em] text-balance lg:text-[3.4rem]">
            Put your next product on one cheek.
          </h2>
          <p className="mt-4 max-w-[46ch] text-lg text-white/85 text-pretty">SplitSide plans the trial around your return window, so you know whether to keep it, return it or stop while you still can.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <StartLink variant="secondary" className="focus-visible:outline-white!" />
            <Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-current/60 px-6 font-medium transition-colors hover:bg-current/10 focus-visible:outline-white!">
              Explore a demo trial
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/85">No account needed. Everything stays on this phone.</p>
        </div>
        <div aria-hidden="true" className="mx-auto flex w-full max-w-[20rem] items-end lg:w-[22rem] lg:max-w-none">
          <ProductArt kind="pump" size={132} className="-mr-[6%] h-auto w-[32%]" />
          <ProductArt kind="jar" size={176} className="relative h-auto w-[46%]" />
          <ProductArt kind="tube" size={116} className="-ml-[7%] h-auto w-[29%] rotate-[7deg]" />
        </div>
      </Reveal>
    </section>
  );
}
