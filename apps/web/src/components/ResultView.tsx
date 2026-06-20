'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import type { CompatibilityResult, RuleResult } from '@/lib/types';
import { RuleStatusChip, ruleAccent } from './status';

export function ResultView({ result }: { result: CompatibilityResult }) {
  const { t, lang } = useI18n();
  const ok = result.decision === 'COMPATIBLE';
  const adaptation = result.requiresAdaptation;
  const heroBg = !ok ? 'bg-bad' : adaptation ? 'bg-warn' : 'bg-ok';

  const blockingLabels = result.blockingRules.map((r) => (lang === 'fr' ? r.labelFr : r.label));

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-xl2 ${heroBg} px-7 py-8 text-white shadow-hero`}
      >
        <div className="text-xs font-medium uppercase tracking-widest opacity-80">
          {t.result.press} {result.pressId} · {t.result.mold} {result.moldId}
        </div>
        <div className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {ok ? t.result.compatible : t.result.notCompatible}
        </div>
        <div className="mt-1 text-sm opacity-90">
          {!ok
            ? `${t.result.blockedBy(result.blockingRules.length)}${blockingLabels.join(', ')}.`
            : adaptation
              ? t.result.adaptation
              : t.result.allPassed}
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        {result.rules.map((rule, i) => (
          <RuleCard key={rule.rule} rule={rule} index={i} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ rule, index, lang }: { rule: RuleResult; index: number; lang: 'fr' | 'en' }) {
  const { t } = useI18n();
  const primary = lang === 'fr' ? rule.labelFr : rule.label;
  const secondary = lang === 'fr' ? rule.label : rule.labelFr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.05, ease: 'easeOut' }}
      className={`card border-l-4 ${ruleAccent[rule.status]} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{primary}</div>
          <div className="text-xs text-ink-muted">{secondary}</div>
        </div>
        <RuleStatusChip status={rule.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-paper px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{t.result.press}</dt>
          <dd className="font-medium">{rule.press}</dd>
        </div>
        <div className="rounded-lg bg-paper px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{t.result.mold}</dt>
          <dd className="font-medium">{rule.mold}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-ink-muted">{rule.details}</p>
      {rule.instruction && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
            rule.status === 'PASS' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
          }`}
        >
          → {rule.instruction}
        </p>
      )}
    </motion.div>
  );
}
