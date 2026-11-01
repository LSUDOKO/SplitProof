import { AppShell } from "./AppShell";
import { ProductArt } from "./ProductArt";
import { ButtonLink } from "./ui";

export function TrialState({ loading }: { loading: boolean }) {
  return (
    <AppShell back="/trials" title="Trial">
      {loading ? (
        <p className="mt-8 text-center text-ink/70" role="status">Loading…</p>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-panel bg-card p-6 text-center shadow-[var(--shadow-soft)]">
          <ProductArt kind="jar" size={96} />
          <p className="mt-3 text-lg">This trial isn&apos;t on this device.</p>
          <p className="mt-1 text-ink/70">Trials live only in the browser where they were created.</p>
          <ButtonLink href="/trials" className="mt-5 w-full">Go to your trials</ButtonLink>
        </div>
      )}
    </AppShell>
  );
}
