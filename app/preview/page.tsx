"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/ui";
import { previews } from "@/lib/db";
import type { PreviewRecord } from "@/lib/types";

const TOOLS = [
  { href: "/preview/shade", title: "Foundation shade swatch", body: "A shade on one half of your face, bare skin or a second shade on the other. See the seam before you buy." },
  { href: "/preview/hair", title: "Hair colour, half and half", body: "The new colour on one side of your head, your current colour on the other." },
  { href: "/preview/earrings", title: "Gold or silver?", body: "One ear gold, one ear silver, in the same photo." },
];

function Thumb({ p }: { p: PreviewRecord }) {
  const url = useMemo(() => URL.createObjectURL(p.image), [p.image]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local blob URL
    <img src={url} alt={p.title} className="aspect-[3/4] w-full rounded-xl object-cover -scale-x-100" />
  );
}

export default function PreviewHub() {
  const [saved, setSaved] = useState<PreviewRecord[]>([]);
  useEffect(() => {
    let alive = true;
    previews.all().then((p) => alive && setSaved(p));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <AppShell>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Preview before you buy</h1>
      <p className="mt-1 text-muted">Try a product on half of you, keep the real you on the other half. Previews are simulations from YouCam AI, never measurements.</p>
      <ul className="mt-5 space-y-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block rounded-panel border border-line bg-card p-5 hover:border-ink/30">
              <h2 className="font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      {saved.length > 0 && (
        <Panel className="mt-5">
          <h2 className="font-semibold">Your previews</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {saved.map((p) => (
              <li key={p.id}>
                <Thumb p={p} />
                <p className="mt-1 truncate text-xs">{p.title}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AppShell>
  );
}
