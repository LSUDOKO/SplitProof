import Link from "next/link";
import { Logo } from "@/components/AppShell";
import { ApisLine } from "@/components/landing/ApisLine";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroArt } from "@/components/landing/HeroArt";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StartLink } from "@/components/landing/kit";
import { PinnedScan } from "@/components/landing/PinnedScan";
import { PreviewMode } from "@/components/landing/PreviewMode";
import { SelfiesLie } from "@/components/landing/SelfiesLie";
import { Trust } from "@/components/landing/Trust";
import { ThemeIconButton } from "@/components/ThemeToggle";
import { ButtonLink } from "@/components/ui";

export default function Landing() {
  return (
    // `clip`, not `hidden`: a scroll container here would break the sticky bar and the pinned section.
    <div className="overflow-x-clip">
      <header className="sticky top-2 z-30 mx-auto mt-2 flex h-14 w-[calc(100%-1.5rem)] max-w-6xl items-center justify-between gap-2 rounded-full bg-card/85 pl-4 pr-1.5 shadow-[var(--shadow-soft)] backdrop-blur">
        <Logo className="shrink-0" />
        <div className="flex min-w-0 items-center gap-1">
          <Link href="/about" className="inline-flex min-h-11 items-center rounded-full px-2 text-right text-[0.8rem] leading-tight text-ink/80 hover:text-ink sm:px-2.5 sm:text-sm">
            How accurate is it?
          </Link>
          <ThemeIconButton />
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 pt-10 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:px-8 lg:py-8">
          <div>
            <h1 className="text-[2.6rem] font-light leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]">
              <span className="block text-balance">Is your skincare actually working?</span>
              <span className="mt-2 block text-balance text-ink/70">Let your face be the control group.</span>
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg text-ink/80 text-pretty">Use a product on one side of your face only. SplitSide measures both sides in the same photo, so lighting, sleep and weather cancel out.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StartLink />
              <ButtonLink href="/demo" variant="secondary">
                Explore a demo trial
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-ink/70">The demo needs no camera and is clearly marked as example data.</p>
          </div>
          <HeroArt />
        </section>

        <PinnedScan />
        <HowItWorks />
        <SelfiesLie />
        <PreviewMode />
        <Trust />
        <ApisLine />
        <FinalCta />
      </main>

      <footer className="mx-auto max-w-6xl space-y-1.5 px-5 pb-10 text-sm text-ink/70 lg:px-8">
        <p>Skin measurements by YouCam AI Skin Analysis (Perfect Corp). Photos stay on your phone.</p>
        <p>SplitSide is a cosmetic decision tool, not a medical device. It measures how skin appears on your photos.</p>
      </footer>
    </div>
  );
}
