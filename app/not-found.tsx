import type { Metadata } from "next";
import { SplitCapsule } from "@/components/landing/SplitCapsule";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <SplitCapsule className="w-[min(60vw,14rem)]">
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[3.4rem] font-light tracking-[0.06em]">
          404
        </span>
      </SplitCapsule>
      <h1 className="mt-8 text-[2.4rem] font-light leading-[1.08] tracking-[-0.02em] text-balance">We looked on both sides.</h1>
      <p className="mt-3 max-w-[34ch] text-lg text-ink/80 text-pretty">This page isn&apos;t on the left or the right. The link may be old, or it may have a typo.</p>
      <ButtonLink href="/" className="mt-8">
        Back to SplitSide
      </ButtonLink>
    </main>
  );
}
