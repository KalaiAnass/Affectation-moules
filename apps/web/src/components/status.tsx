'use client';

import type { Decision, RuleStatus } from '@/lib/types';

const ruleStyles: Record<RuleStatus, { chip: string; icon: string; label: string }> = {
  PASS: { chip: 'bg-ok-soft text-ok', icon: '✓', label: 'Pass' },
  FAIL: { chip: 'bg-bad-soft text-bad', icon: '✗', label: 'Fail' },
  ADAPTATION: { chip: 'bg-warn-soft text-warn', icon: '⚠', label: 'Adaptation' },
};

export function RuleStatusChip({ status }: { status: RuleStatus }) {
  const s = ruleStyles[status];
  return (
    <span className={`chip ${s.chip}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
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
  if (decision === 'NOT_COMPATIBLE') {
    return <span className="chip bg-bad-soft text-bad">✗ Not compatible</span>;
  }
  if (requiresAdaptation) {
    return <span className="chip bg-warn-soft text-warn">⚠ Compatible · adaptation</span>;
  }
  return <span className="chip bg-ok-soft text-ok">✓ Compatible</span>;
}

export const ruleAccent: Record<RuleStatus, string> = {
  PASS: 'border-l-ok',
  FAIL: 'border-l-bad',
  ADAPTATION: 'border-l-warn',
};
