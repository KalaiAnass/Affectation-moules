'use client';

import { useI18n } from '@/lib/i18n';
import type { Decision, RuleStatus } from '@/lib/types';

const ruleStyle: Record<RuleStatus, { chip: string; icon: string }> = {
  PASS: { chip: 'bg-ok-soft text-ok', icon: '✓' },
  FAIL: { chip: 'bg-bad-soft text-bad', icon: '✗' },
  ADAPTATION: { chip: 'bg-warn-soft text-warn', icon: '⚠' },
};

export function RuleStatusChip({ status }: { status: RuleStatus }) {
  const { t } = useI18n();
  const s = ruleStyle[status];
  const label = status === 'PASS' ? t.chip.pass : status === 'FAIL' ? t.chip.fail : t.chip.adaptation;
  return (
    <span className={`chip ${s.chip}`}>
      <span aria-hidden>{s.icon}</span>
      {label}
    </span>
  );
}

export function DecisionChip({
  decision,
  requiresAdaptation,
}: {
  decision: Decision;
  requiresAdaptation?: boolean;
}) {
  const { t } = useI18n();
  if (decision === 'NOT_COMPATIBLE') {
    return <span className="chip bg-bad-soft text-bad">✗ {t.chip.notCompatible}</span>;
  }
  if (requiresAdaptation) {
    return <span className="chip bg-warn-soft text-warn">⚠ {t.chip.compatibleAdaptation}</span>;
  }
  return <span className="chip bg-ok-soft text-ok">✓ {t.chip.compatible}</span>;
}

export const ruleAccent: Record<RuleStatus, string> = {
  PASS: 'border-l-ok',
  FAIL: 'border-l-bad',
  ADAPTATION: 'border-l-warn',
};
