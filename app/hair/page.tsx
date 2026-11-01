"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, DemoBadge, Field, Panel, inputClass } from "@/components/ui";
import { hairTrials, newId } from "@/lib/db";
import { HAIR_VERDICT_TEXT, judgeHair, type HairTrial } from "@/lib/hair/model";
import { randomSide } from "@/lib/trial/plan";

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
      <p className="mt-1 text-muted">
        Does your anti-frizz serum work? Use it on one side of your parting only. Every few days, take a front photo and one of each side; YouCam AI rates frizz on each side and SplitSide compares them.
      </p>
      <Panel className="mt-4" tone="control">
        <p className="text-sm">
          Beta: frizz is rated on a 4-step scale, so only clear, repeated differences count and confidence stays low. Humidity and wash day affect both sides equally, which is why the comparison still works.
        </p>
      </Panel>
      <Panel className="mt-3">
        <Field label="Hair product">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anti-frizz serum" />
        </Field>
        <Button className="mt-4 w-full" disabled={!name.trim()} onClick={create}>
          Start a hair trial
        </Button>
      </Panel>
      {list.length > 0 && (
        <ul className="mt-4 space-y-3">
          {list.map((t) => {
            const v = judgeHair(t);
            return (
              <li key={t.id}>
                <Link href={`/hair/${t.id}`} className="block rounded-panel border border-line bg-card p-4 hover:border-ink/30">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{t.product}</p>
                    {t.isDemo && <DemoBadge />}
                  </div>
                  <p className="mt-1 text-sm text-muted">Product on your {t.treatedSide} side · {t.checks.length} check-ins</p>
                  <p className="mt-2 text-sm">{HAIR_VERDICT_TEXT[v.verdict]}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
