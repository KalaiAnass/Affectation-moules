'use client';

import { CheckPanel } from '@/components/CheckPanel';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <section className="pt-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">{t.home.kicker}</p>
        <h1 className="text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {t.home.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-muted">{t.home.subtitle}</p>
      </section>

      <CheckPanel />
    </div>
  );
}
