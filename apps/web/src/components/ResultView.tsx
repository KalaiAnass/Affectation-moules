'use client';

import { motion } from 'framer-motion';
import type { CompatibilityResult, RuleResult } from '@/lib/types';
import { RuleStatusChip, ruleAccent } from './status';

export function ResultView({ result }: { result: CompatibilityResult }) {
  const ok = result.decision === 'COMPATIBLE';
  const adaptation = result.requiresAdaptation;
  const heroBg = !ok ? 'bg-bad' : adaptation ? 'bg-warn' : 'bg-ok';

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-xl2 ${heroBg} px-7 py-8 text-white shadow-hero`}
      >
        <div className="text-xs font-medium uppercase tracking-widest opacity-80">
          Press {result.pressId} · Mold {result.moldId}
        </div>
        <div className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {ok ? 'COMPATIBLE' : 'NOT COMPATIBLE'}
        </div>
        <div className="mt-1 text-sm opacity-90">
          {!ok
            ? `Blocked by ${result.blockingRules.length} rule${result.blockingRules.length > 1 ? 's' : ''}: ${result.blockingRules
                .map((r) => r.label)
                .join(', ')}.`
            : adaptation
              ? 'Mountable with an adaptation — see the highlighted steps below.'
              : 'All checks passed. Ready to mount.'}
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        {result.rules.map((rule, i) => (
          <RuleCard key={rule.rule} rule={rule} index={i} />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ rule, index }: { rule: RuleResult; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.05, ease: 'easeOut' }}
      className={`card border-l-4 ${ruleAccent[rule.status]} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{rule.label}</div>
          <div className="text-xs text-ink-muted">{rule.labelFr}</div>
        </div>
        <RuleStatusChip status={rule.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-paper px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Press</dt>
          <dd className="font-medium">{rule.press}</dd>
        </div>
        <div className="rounded-lg bg-paper px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Mold</dt>
          <dd className="font-medium">{rule.mold}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-ink-muted">{rule.details}</p>
      {rule.instruction && (
        <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm font-medium text-warn">
          → {rule.instruction}
        </p>
      )}
    </motion.div>
  );
}
