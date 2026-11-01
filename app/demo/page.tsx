"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tag } from "@/components/landing/kit";
import { FaceLineArt, ScannerFrame } from "@/components/ScannerFrame";
import { ButtonLink } from "@/components/ui";
import { loadDemo } from "@/lib/demo/load";

export default function DemoEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadDemo()
      .then(() => router.replace("/trials?demo=1"))
      .catch(() => setFailed(true));
  }, [router]);
  if (failed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <p className="text-lg text-pretty" role="alert">This browser blocks on-device storage (private mode?). Open SplitSide in a normal tab.</p>
        <ButtonLink href="/">Back to SplitSide</ButtonLink>
      </main>
    );
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <div className="w-[min(100%,calc((100svh-14rem)*0.73))]">
        <ScannerFrame live status="Loading demo trials…">
          <FaceLineArt />
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-current text-white [--h:24rem] motion-safe:[animation:scanline_2.8s_ease-in-out_infinite]" />
        </ScannerFrame>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Tag>Demo data</Tag>
        <p className="text-ink/80">Example trials, no camera needed.</p>
      </div>
    </main>
  );
}
