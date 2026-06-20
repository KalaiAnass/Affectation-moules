'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectProps {
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Minimal, accessible, searchable select with a tasteful motion panel. */
export function Select({ label, placeholder, options, value, onChange, disabled }: SelectProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition hover:border-ink-muted/40 disabled:opacity-50"
      >
        <span className={selected ? 'font-medium' : 'text-ink-muted'}>
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel && (
                <span className="ml-2 text-sm font-normal text-ink-muted">{selected.sublabel}</span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-ink-muted" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-hero"
          >
            <div className="border-b border-line p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.select.search}
                className="w-full rounded-xl bg-paper px-3 py-2 text-sm outline-none"
              />
            </div>
            <ul className="max-h-72 overflow-auto p-1">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">{t.select.noMatch}</li>
              )}
              {filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-paper ${
                      o.value === value ? 'bg-paper font-medium' : ''
                    }`}
                  >
                    <span>{o.label}</span>
                    {o.sublabel && <span className="text-xs text-ink-muted">{o.sublabel}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
