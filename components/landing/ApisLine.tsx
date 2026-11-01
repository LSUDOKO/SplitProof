import { Reveal } from "@/components/motion";
import { Tag } from "./kit";

const YOUCAM = ["AI Skin Analysis (HD)", "Skin Simulation", "Skin Tone Analysis", "Fitzpatrick Skin Type", "Makeup VTO", "Hair Color VTO", "Earrings VTO", "Hair Frizziness Detection", "Photo Background Blur"];

export function ApisLine() {
  return (
    <section aria-labelledby="apis-title" className="mx-auto max-w-6xl px-5 pb-16 lg:px-8 lg:pb-28">
      <Reveal scroll>
        <h2 id="apis-title" className="text-2xl font-light tracking-[-0.01em] text-balance lg:text-3xl">
          Built on the YouCam API by Perfect Corp
        </h2>
        <p className="mt-3 max-w-[64ch] text-ink/80 text-pretty">AI Skin Analysis returns a detection mask for each concern. SplitSide splits every mask at your midline, which turns one whole-face result into a two-sided measurement.</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {YOUCAM.map((api) => (
            <li key={api}>
              <Tag>{api}</Tag>
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-[64ch] text-sm text-ink/80 text-pretty">The trial assistant runs on Groq. Product lookups come from Open Beauty Facts, and local weather from Open-Meteo.</p>
      </Reveal>
    </section>
  );
}
