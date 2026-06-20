'use client';

import { useEffect, useState } from 'react';
import { DecisionChip } from '@/components/status';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { AuditItem, Decision } from '@/lib/types';

export default function AuditPage() {
  const { t, lang } = useI18n();
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
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : t.check.loadError));
  }, [t]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.audit.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t.audit.subtitle} {total > 0 && `(${total})`}
        </p>
      </header>

      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

      {items && items.length === 0 && <p className="text-sm text-ink-muted">{t.audit.empty}</p>}

      {items && items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.audit.when}</th>
                <th className="px-4 py-3 font-medium">{t.audit.user}</th>
                <th className="px-4 py-3 font-medium">{t.audit.press}</th>
                <th className="px-4 py-3 font-medium">{t.audit.mold}</th>
                <th className="px-4 py-3 font-medium">{t.audit.result}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {new Date(it.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
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
