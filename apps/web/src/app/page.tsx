import { AuthGate } from '@/components/AuthGate';
import { CheckPanel } from '@/components/CheckPanel';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="pt-6 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Can this mold run on this press?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-ink-muted">
          Pick a press and a mold. Get an instant, fully explained mountability decision —
          every rule, every clearance, every required adaptation.
        </p>
      </section>

      <AuthGate>
        <CheckPanel />
      </AuthGate>
    </div>
  );
}
