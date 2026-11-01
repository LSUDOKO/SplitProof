import { Logo } from "@/components/AppShell";
import { SplitFace } from "@/components/SplitFace";
import { ButtonLink } from "@/components/ui";

const STEPS = [
  { title: "One side", body: "SplitSide picks a cheek at random. The product goes there only; the other cheek is your control." },
  { title: "Same photo", body: "Every few days you take one guided selfie. YouCam AI Skin Analysis measures both halves of that same photo." },
  { title: "Real answer", body: "Light, sleep, stress and weather hit both sides equally, so they cancel out. What's left is the product." },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-md px-5 pb-16">
      <header className="flex h-16 items-center justify-between">
        <Logo />
        <a href="/about" className="text-sm font-medium text-muted hover:text-ink">
          How accurate is it?
        </a>
      </header>

      <section className="pt-6 text-center">
        <SplitFace size={210} treatedLabel="Product" controlLabel="Nothing" treatedSide="left" />
        <h1 className="mt-8 text-[2.1rem] font-bold leading-[1.08] tracking-tight text-balance">Is your skincare actually working?</h1>
        <p className="mt-3 text-lg font-medium text-balance">Let your face be the control group.</p>
        <p className="mx-auto mt-4 max-w-[34ch] text-muted text-pretty">
          Use a product on one side of your face only. SplitSide measures both sides in the same photo, so lighting, sleep and weather cancel out.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <ButtonLink href="/consent">Start a trial</ButtonLink>
          <ButtonLink href="/demo" variant="secondary">
            Explore a demo trial
          </ButtonLink>
        </div>
        <p className="mt-3 text-sm text-muted">The demo needs no camera and is clearly marked as example data.</p>
      </section>

      <ol className="mt-14 space-y-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card font-semibold" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-panel border border-line bg-card p-5">
        <h2 className="font-semibold">Measure what works. Preview before you buy.</h2>
        <p className="mt-2 text-muted">
          Not sure about a foundation shade or a hair colour? Preview mode puts it on half of your face or head and keeps the real you on the other half, so you can see the edge before you spend. Previews are always labelled as simulations and never count as measurements.
        </p>
        <a href="/preview" className="mt-3 inline-block font-semibold underline underline-offset-4">Try a preview</a>
      </section>

      <section className="mt-3 rounded-panel border border-line bg-card p-5">
        <h2 className="font-semibold">Why not just before-and-after selfies?</h2>
        <p className="mt-2 text-muted">
          A bad night or a cloudy window changes your skin score more than most products do. Dermatologists solve this with split-face trials, where one side of the face is the control. SplitSide brings that method home and tells you whether to keep it, return it, or stop.
        </p>
      </section>

      <footer className="mt-12 space-y-2 text-sm text-muted">
        <p>Skin measurements by YouCam AI Skin Analysis (Perfect Corp). Photos stay on your phone.</p>
        <p>SplitSide is a cosmetic decision tool. It does not diagnose or treat any condition.</p>
      </footer>
    </div>
  );
}
