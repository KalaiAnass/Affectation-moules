'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ResultModal } from '@/components/ResultModal';
import { Select, type Option } from '@/components/Select';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { CompatibilityResult, MatrixEntry, Mold } from '@/lib/types';

export default function MatrixPage() {
  const { t, lang } = useI18n();
  const [molds, setMolds] = useState<Mold[]>([]);
  const [moldId, setMoldId] = useState<string | null>(null);
  const [entries, setEntries] = useState<MatrixEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompatibilityResult | null>(null);

  useEffect(() => {
    api.molds().then(setMolds).catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.loadError));
  }, [t]);

  useEffect(() => {
    if (!moldId) return;
    setLoading(true);
    setError(null);
    api
      .matrix(moldId, lang)
      .then((r) => setEntries(r.entries))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.failed))
      .finally(() => setLoading(false));
  }, [moldId, lang, t]);

  async function openDetail(pressId: string) {
    if (!moldId) return;
    try {
      setDetail(await api.check(pressId, moldId, lang, false));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.check.failed);
    }
  }

  const options: Option[] = molds.map((m) => ({ value: m.id, label: m.id, sublabel: m.designation.slice(0, 40) }));
  const compatible = entries?.filter((e) => e.decision === 'COMPATIBLE') ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.matrix.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.matrix.subtitle}</p>
      </header>

      <div className="card max-w-md p-5">
        <Select
          label={t.select.mold}
          placeholder={t.select.moldPlaceholder}
          options={options}
          value={moldId}
          onChange={setMoldId}
        />
      </div>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      {loading && <p className="text-sm text-ink-muted">{t.common.evaluating}</p>}

      {entries && !loading && (
        <>
          <p className="text-sm text-ink-muted">{t.matrix.summary(compatible.length, entries.length)}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e, i) => (
              <motion.button
                key={e.pressId}
                type="button"
                onClick={() => openDetail(e.pressId)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="card group flex w-full items-center justify-between p-4 text-left transition hover:border-brand/50 hover:shadow-hero"
              >
                <div className="min-w-0">
                  <div className="font-medium">{e.pressId}</div>
                  {e.decision === 'NOT_COMPATIBLE' ? (
                    <div className="truncate text-xs text-ink-muted">{e.blockingRuleLabels.join(', ')}</div>
                  ) : e.requiresAdaptation ? (
                    <div className="truncate text-xs text-warn">{e.conditionRuleLabels.join(', ')}</div>
                  ) : (
                    <div className="text-xs text-brand opacity-0 transition group-hover:opacity-100">
                      {t.common.details} →
                    </div>
                  )}
                </div>
                <DecisionChip decision={e.decision} requiresAdaptation={e.requiresAdaptation} />
              </motion.button>
            ))}
          </div>
        </>
      )}

      <ResultModal result={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
