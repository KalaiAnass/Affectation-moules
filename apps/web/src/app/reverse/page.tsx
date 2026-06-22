'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ResultModal } from '@/components/ResultModal';
import { Select, type Option } from '@/components/Select';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { CompatibilityResult, Press, ReverseEntry } from '@/lib/types';

export default function ReversePage() {
  const { t, lang } = useI18n();
  const [presses, setPresses] = useState<Press[]>([]);
  const [pressId, setPressId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReverseEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompatibilityResult | null>(null);

  useEffect(() => {
    api.presses().then(setPresses).catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.loadError));
  }, [t]);

  useEffect(() => {
    if (!pressId) return;
    setLoading(true);
    setError(null);
    api
      .reverse(pressId, lang)
      .then((r) => setEntries(r.entries))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.failed))
      .finally(() => setLoading(false));
  }, [pressId, lang, t]);

  async function openDetail(moldId: string) {
    if (!pressId) return;
    try {
      setDetail(await api.check(pressId, moldId, lang, false));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.check.failed);
    }
  }

  const options: Option[] = presses.map((p) => ({
    value: p.id,
    label: p.id,
    sublabel: `${p.brand} · ${p.clampingForce} t`,
  }));
  const compatible = entries?.filter((e) => e.decision === 'COMPATIBLE') ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.reverse.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.reverse.subtitle}</p>
      </header>

      <div className="card max-w-md p-5">
        <Select
          label={t.select.press}
          placeholder={t.select.pressPlaceholder}
          options={options}
          value={pressId}
          onChange={setPressId}
        />
      </div>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      {loading && <p className="text-sm text-ink-muted">{t.common.evaluating}</p>}

      {entries && !loading && (
        <>
          <p className="text-sm text-ink-muted">{t.reverse.summary(compatible.length, entries.length)}</p>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <motion.button
                key={e.moldId}
                type="button"
                onClick={() => openDetail(e.moldId)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="card group flex w-full items-center justify-between gap-4 p-4 text-left transition hover:border-brand/50 hover:shadow-hero"
              >
                <div className="min-w-0">
                  <div className="font-medium">{e.moldId}</div>
                  <div className="truncate text-xs text-ink-muted">
                    {e.designation || '—'}
                    {e.decision === 'NOT_COMPATIBLE' && ` · ${e.blockingRuleLabels.join(', ')}`}
                  </div>
                  {e.decision === 'COMPATIBLE' && e.requiresAdaptation && (
                    <div className="truncate text-xs text-warn">{e.conditionRuleLabels.join(', ')}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-brand opacity-0 transition group-hover:opacity-100 sm:inline">
                    {t.common.details} →
                  </span>
                  <DecisionChip decision={e.decision} requiresAdaptation={e.requiresAdaptation} />
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      <ResultModal result={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
