import { Clock, Lock, MessageSquareText, Smartphone, Trash2 } from "lucide-react";
import { Reveal } from "@/components/motion";
import { FaceLineArt, ScannerFrame } from "@/components/ScannerFrame";
import { H2, LEDE, SECTION, Tag } from "./kit";

const POINTS = [
  { icon: Smartphone, title: "Stored on this phone", body: "Photos, masks and results live only in your browser's on-device storage." },
  { icon: Clock, title: "Gone from YouCam within 24 hours", body: "Each photo goes to YouCam by Perfect Corp only to be analysed, and YouCam deletes the results within 24 hours." },
  { icon: MessageSquareText, title: "Numbers only for the assistant", body: "The trial assistant receives numbers and text, never photos." },
  { icon: Trash2, title: "Delete everything, any time", body: "One button in Settings clears every trial, photo and result." },
];

export function Trust() {
  return (
    <section aria-labelledby="trust-title" className={SECTION}>
      <Reveal scroll className="grid items-center gap-10 rounded-[2.25rem] bg-card p-6 shadow-[var(--shadow-soft)] lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16 lg:p-14">
        <div className="mx-auto w-[13.5rem] rounded-[2.6rem] bg-night p-2 shadow-[var(--shadow-float)]">
          <div className="relative rounded-[2.1rem] bg-paper px-4 pb-5 pt-9">
            <span aria-hidden="true" className="absolute inset-x-[4.5rem] top-3 h-3.5 rounded-full bg-night" />
            <ScannerFrame>
              <FaceLineArt />
            </ScannerFrame>
            <div className="mt-3 flex justify-center">
              <Tag small>
                <Lock size={13} aria-hidden="true" />
                On this phone
              </Tag>
            </div>
          </div>
        </div>
        <div>
          <h2 id="trust-title" className={H2}>
            Your photos stay on your phone
          </h2>
          <p className={LEDE}>SplitSide has no accounts, so there&apos;s nothing to sign in to and no profile to hand over.</p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised shadow-[var(--shadow-soft)]">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="mt-0.5 block text-sm text-ink/80 text-pretty">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
