'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Select, type Option } from '@/components/Select';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import type { Press, ReverseEntry } from '@/lib/types';

function ReverseInner() {
  const [presses, setPresses] = useState<Press[]>([]);
  const [pressId, setPressId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReverseEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.presses().then(setPresses).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Load failed'));
  }, []);

  useEffect(() => {
    if (!pressId) return;
    setLoading(true);
    setError(null);
    api
      .reverse(pressId)
      .then((r) => setEntries(r.entries))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [pressId]);

  const options: Option[] = presses.map((p) => ({
    value: p.id,
    label: p.id,
    sublabel: `${p.brand} · ${p.clampingForce} t`,
  }));
  const compatible = entries?.filter((e) => e.decision === 'COMPATIBLE') ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reverse search</h1>
        <p className="mt-1 text-sm text-ink-muted">Find every mold that fits a given press.</p>
      </header>

      <div className="card max-w-md p-5">
        <Select label="Press" placeholder="Select a press" options={options} value={pressId} onChange={setPressId} />
      </div>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      {loading && <p className="text-sm text-ink-muted">Evaluating…</p>}

      {entries && !loading && (
        <>
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">{compatible.length}</span> of {entries.length} molds are
            compatible.
          </p>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <motion.div
                key={e.moldId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="card flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium">{e.moldId}</div>
                  <div className="truncate text-xs text-ink-muted">
                    {e.designation || '—'}
                    {e.decision === 'NOT_COMPATIBLE' && ` · ${e.blockingRuleLabels.join(', ')}`}
                  </div>
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

export default function ReversePage() {
  return (
    <AuthGate>
      <ReverseInner />
    </AuthGate>
  );
}
