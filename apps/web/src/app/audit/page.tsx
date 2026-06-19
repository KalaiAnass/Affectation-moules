'use client';

import { useEffect, useState } from 'react';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import type { AuditItem, Decision } from '@/lib/types';

function AuditInner() {
  const [items, setItems] = useState<AuditItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .audit(0, 100)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e: unknown) =>
        setError(
          e instanceof ApiError
            ? e.status === 403
              ? 'Audit history is restricted to Administrators and Engineers.'
              : e.message
            : 'Failed to load',
        ),
      );
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit history</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every compatibility check is recorded for traceability. {total > 0 && `${total} total.`}
        </p>
      </header>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

      {items && items.length === 0 && <p className="text-sm text-ink-muted">No checks recorded yet.</p>}

      {items && items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Press</th>
                <th className="px-4 py-3 font-medium">Mold</th>
                <th className="px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{it.userEmail ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{it.pressId ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{it.moldId ?? '—'}</td>
                  <td className="px-4 py-3">
                    {it.decision ? (
                      <DecisionChip
                        decision={it.decision as Decision}
                        requiresAdaptation={it.requiresAdaptation ?? false}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return <AuditInner />;
}
