import { AppShell } from "./AppShell";
import { ButtonLink } from "./ui";

export function TrialState({ loading }: { loading: boolean }) {
  return (
    <AppShell back="/trials">
      {loading ? (
        <p className="mt-8 text-muted" role="status">Loading…</p>
      ) : (
        <div className="mt-8 text-center">
          <p className="font-medium">This trial isn&apos;t on this device.</p>
          <p className="mt-1 text-muted">Trials live only in the browser where they were created.</p>
          <ButtonLink href="/trials" className="mt-5">Go to your trials</ButtonLink>
        </div>
      )}
    </AppShell>
  );
}
