"use client";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { ProductArt } from "@/components/ProductArt";
import { Button, DemoBadge, Field, Panel, inputClass } from "@/components/ui";
import { hairTrials, newId } from "@/lib/db";
import { HAIR_VERDICT_TEXT, judgeHair, type HairTrial } from "@/lib/hair/model";
import { randomSide } from "@/lib/trial/plan";

function HairTrialCard({ t }: { t: HairTrial }) {
  const v = judgeHair(t);
  return (
    <Link href={`/hair/${t.id}`} className="block rounded-panel bg-card p-4 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-lg leading-snug">{t.product}</p>
        {t.isDemo && <DemoBadge />}
      </div>
      <p className="mt-1 text-sm text-ink/70">
        Product on your {t.treatedSide} side · {t.checks.length} check-ins
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-sm">{HAIR_VERDICT_TEXT[v.verdict]}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </Link>
  );
}

export default function HairTrials() {
  const router = useRouter();
  const [list, setList] = useState<HairTrial[]>([]);
  const [name, setName] = useState("");
  useEffect(() => {
    let alive = true;
    hairTrials.all().then((l) => alive && setList(l));
    return () => {
      alive = false;
    };
  }, []);

  const create = async () => {
    const t: HairTrial = { id: newId(), product: name.trim(), treatedSide: randomSide(), createdAt: new Date().toISOString(), plannedDays: 14, checks: [], isDemo: false };
    await hairTrials.put(t);
    router.push(`/hair/${t.id}`);
  };

  return (
    <AppShell back="/trials" title="SplitHair (beta)">
      <div className="mt-1 flex items-center gap-3">
        <p className="min-w-0 flex-1 text-ink/70">Does your anti-frizz serum work? Use it on one side of your parting only. Every few days, take a front photo and one of each side; YouCam AI rates frizz on each side and SplitSide compares them.</p>
        <ProductArt kind="pump" size={92} className="shrink-0" />
      </div>
      <Panel className="mt-4" tone="control">
        <div className="flex items-start gap-3">
          <FlaskConical size={20} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            Beta: frizz is rated on a 4-step scale, so only clear, repeated differences count and confidence stays low. Humidity and wash day affect both sides equally, which is why the comparison still works.
          </p>
        </div>
      </Panel>
      <Panel className="mt-3">
        <Field label="Hair product">
          <input className={`${inputClass} placeholder:text-ink/70!`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anti-frizz serum" />
        </Field>
        <Button className="mt-4 w-full" disabled={!name.trim()} onClick={create}>
          Start a hair trial
        </Button>
      </Panel>
      {list.length > 0 && (
        <div className="mt-4">
          <Reveal as="ul" stagger={0.08} className="space-y-3">
            {list.map((t) => (
              <li key={t.id}>
                <HairTrialCard t={t} />
              </li>
            ))}
          </Reveal>
        </div>
      )}
    </AppShell>
  );
}
