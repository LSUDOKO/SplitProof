import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { H2, LEDE, SECTION, Tag } from "./kit";
import { BOX, CAPSULE, EAR, FACE, FEATURES, MIRROR, NECK, NOSE_SIDE, NOSE_TIP } from "./ScanFace";

const LONG_HAIR = "M200 72C134 72 84 118 82 200C80 290 78 380 62 520H338C322 380 320 290 318 200C316 118 266 72 200 72Z";
const BARE = "#e7c0a3";
const SHADE = "#c98f6b";
const COPPER = "#a8562a";
const DARK_HAIR = "#2e2622";
const LINE = "#3b2a20";

/**
 * The scanner face with each half coloured separately. Skin and hair are real-world
 * illustration colours, so they stay the same in both themes.
 */
function HalfFace({ skin, hair }: { skin: [string, string]; hair: [string, string] }) {
  const id = useId();
  const half = (i: 0 | 1) => ({ x: i ? 200 : 0, width: 200, height: 548 });
  return (
    <svg viewBox={BOX} className="h-40 w-auto shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-capsule`}>
          <path d={CAPSULE} />
        </clipPath>
        <clipPath id={`${id}-hair`}>
          <path d={LONG_HAIR} />
        </clipPath>
        <clipPath id={`${id}-skin`}>
          <path d={FACE} />
          <path d={NECK} />
          <path d={EAR} />
          <path d={EAR} transform={MIRROR} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-capsule)`}>
        <rect width="400" height="548" fill="var(--color-forest)" />
        <g clipPath={`url(#${id}-hair)`}>
          <rect {...half(0)} fill={hair[0]} />
          <rect {...half(1)} fill={hair[1]} />
        </g>
        <g clipPath={`url(#${id}-skin)`}>
          <rect {...half(0)} fill={skin[0]} />
          <rect {...half(1)} fill={skin[1]} />
        </g>
      </g>
      <g fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round">
        {[...FEATURES, NOSE_SIDE].map((d) => (
          <g key={d}>
            <path d={d} />
            <path d={d} transform={MIRROR} />
          </g>
        ))}
        <path d={NOSE_TIP} />
      </g>
      <path d="M200 30V518" stroke="white" strokeWidth="3" strokeDasharray="10 11" />
    </svg>
  );
}

function ShadeArt() {
  return (
    <div className="flex items-center">
      <HalfFace skin={[SHADE, BARE]} hair={[DARK_HAIR, DARK_HAIR]} />
      <ProductArt kind="tube" size={84} className="-ml-5 mt-10 rotate-[8deg]" />
    </div>
  );
}

const HairArt = () => <HalfFace skin={[BARE, BARE]} hair={[COPPER, DARK_HAIR]} />;

function HoopArt() {
  return (
    <div className="flex items-center gap-1">
      <Image src="/preview/hoop-gold.png" alt="" width={104} height={104} className="h-[5.5rem] w-[5.5rem] lg:h-[6.5rem] lg:w-[6.5rem]" />
      <span aria-hidden="true" className="h-32 border-l border-dashed border-ink/50" />
      <Image src="/preview/hoop-silver.png" alt="" width={104} height={104} className="h-[5.5rem] w-[5.5rem] lg:h-[6.5rem] lg:w-[6.5rem]" />
    </div>
  );
}

const TOOLS: { href: string; title: string; body: string; art: ReactNode }[] = [
  { href: "/preview/shade", title: "Foundation shade", body: "A shade on one half of your face, bare skin or a second shade on the other. See the seam before you buy.", art: <ShadeArt /> },
  { href: "/preview/hair", title: "Hair colour", body: "The new colour on one side of your head, your current colour on the other.", art: <HairArt /> },
  { href: "/preview/earrings", title: "Gold or silver?", body: "One gold hoop on one ear, one silver hoop on the other, in the same photo.", art: <HoopArt /> },
];

export function PreviewMode() {
  return (
    <section aria-labelledby="preview-title" className={SECTION}>
      <Reveal scroll>
        <h2 id="preview-title" className={H2}>
          Preview before you buy
        </h2>
        <p className={LEDE}>Try it on half of you and keep the real you on the other half. Previews are simulations from YouCam AI, never measurements, and they never count towards a trial.</p>
      </Reveal>
      <Reveal scroll stagger={0.1} as="ul" className="mt-10 grid gap-3 md:grid-cols-3 lg:mt-14 lg:gap-5">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="relative flex h-full flex-col rounded-panel bg-card p-3 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1">
              <div className="relative flex h-48 items-center justify-center rounded-[1.25rem] bg-paper/70">
                {t.art}
                <span className="absolute left-2.5 top-2.5">
                  <Tag small>Simulation</Tag>
                </span>
              </div>
              <div className="flex-1 px-2 pb-1 pr-14 pt-4">
                <h3 className="text-xl font-light tracking-[-0.01em]">{t.title}</h3>
                <p className="mt-1 text-sm text-ink/80 text-pretty">{t.body}</p>
              </div>
              <span aria-hidden="true" className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-forest text-white">
                <ArrowUpRight size={18} />
              </span>
            </Link>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
