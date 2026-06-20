'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { CompatibilityResult, Mold, Press } from '@/lib/types';
import { Select, type Option } from './Select';
import { ResultView } from './ResultView';

export function CheckPanel() {
  const { t, lang } = useI18n();
  const [presses, setPresses] = useState<Press[]>([]);
  const [molds, setMolds] = useState<Mold[]>([]);
  const [pressId, setPressId] = useState<string | null>(null);
  const [moldId, setMoldId] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.presses(), api.molds()])
      .then(([p, m]) => {
        setPresses(p);
        setMolds(m);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.loadError));
  }, [t]);

  const pressOptions: Option[] = presses.map((p) => ({
    value: p.id,
    label: p.id,
    sublabel: `${p.brand} · ${p.clampingForce} t`,
  }));
  const moldOptions: Option[] = molds.map((m) => ({
    value: m.id,
    label: m.id,
    sublabel: m.designation.slice(0, 40),
  }));

  async function onCheck() {
    if (!pressId || !moldId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.check(pressId, moldId, lang));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.check.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t.select.press}
            placeholder={t.select.pressPlaceholder}
            options={pressOptions}
            value={pressId}
            onChange={(v) => {
              setPressId(v);
              setResult(null);
            }}
          />
          <Select
            label={t.select.mold}
            placeholder={t.select.moldPlaceholder}
            options={moldOptions}
            value={moldId}
            onChange={(v) => {
              setMoldId(v);
              setResult(null);
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">{pressId && moldId ? t.check.ready : t.check.choose}</p>
          <button onClick={onCheck} disabled={!pressId || !moldId || loading} className="btn-primary">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {t.check.button}
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={`${result.pressId}-${result.moldId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultView result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
