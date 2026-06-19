'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Select, type Option } from '@/components/Select';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import type { MatrixEntry, Mold } from '@/lib/types';

function MatrixInner() {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [moldId, setMoldId] = useState<string | null>(null);
  const [entries, setEntries] = useState<MatrixEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.molds().then(setMolds).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Load failed'));
  }, []);

  useEffect(() => {
    if (!moldId) return;
    setLoading(true);
    setError(null);
    api
      .matrix(moldId)
      .then((r) => setEntries(r.entries))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [moldId]);

  const options: Option[] = molds.map((m) => ({ value: m.id, label: m.id, sublabel: m.designation.slice(0, 40) }));
  const compatible = entries?.filter((e) => e.decision === 'COMPATIBLE') ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Compatibility matrix</h1>
        <p className="mt-1 text-sm text-ink-muted">Test one mold against every press.</p>
      </header>

      <div className="card max-w-md p-5">
        <Select label="Mold" placeholder="Select a mold" options={options} value={moldId} onChange={setMoldId} />
      </div>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

      {loading && <p className="text-sm text-ink-muted">Evaluating…</p>}

      {entries && !loading && (
        <>
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">{compatible.length}</span> of {entries.length} presses
            are compatible.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e, i) => (
              <motion.div
                key={e.pressId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="card flex items-center justify-between p-4"
              >
                <div>
                  <div className="font-medium">{e.pressId}</div>
                  {e.decision === 'NOT_COMPATIBLE' && (
                    <div className="text-xs text-ink-muted">{e.blockingRuleLabels.join(', ')}</div>
                  )}
                </div>
                <DecisionChip decision={e.decision} requiresAdaptation={e.requiresAdaptation} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MatrixPage() {
  return <MatrixInner />;
}
