/**
 * Compatibility decision engine.
 *
 * Composes the rule evaluators and derives the final decision:
 *   - any rule FAIL                 => NOT_COMPATIBLE
 *   - only PASS / ADAPTATION        => COMPATIBLE (orange if any ADAPTATION)
 *
 * Pure and synchronous: a single evaluation is O(rules) and well under the
 * 100 ms performance target; a full matrix is O(presses × molds × rules).
 */
import { RULE_EVALUATORS } from './rules.js';
import type { CompatibilityResult, Mold, Press, RuleResult } from './types.js';

/** Evaluate one mold against one press. */
export function checkCompatibility(press: Press, mold: Mold): CompatibilityResult {
  const rules: RuleResult[] = RULE_EVALUATORS.map((evaluate) => evaluate(press, mold));
  const blockingRules = rules.filter((r) => r.status === 'FAIL');
  const requiresAdaptation = rules.some((r) => r.status === 'ADAPTATION');
  return {
    pressId: press.id,
    moldId: mold.id,
    decision: blockingRules.length > 0 ? 'NOT_COMPATIBLE' : 'COMPATIBLE',
    requiresAdaptation,
    rules,
    blockingRules,
  };
}

/** A row of a compatibility matrix: one mold tested against every press. */
export interface MatrixEntry {
  pressId: string;
  decision: CompatibilityResult['decision'];
  requiresAdaptation: boolean;
  blockingRuleLabels: string[];
}

/** Compatibility matrix: test one mold against all supplied presses. */
export function compatibilityMatrix(mold: Mold, presses: Press[]): MatrixEntry[] {
  return presses.map((press) => {
    const result = checkCompatibility(press, mold);
    return {
      pressId: press.id,
      decision: result.decision,
      requiresAdaptation: result.requiresAdaptation,
      blockingRuleLabels: result.blockingRules.map((r) => r.label),
    };
  });
}

/** Reverse search: every mold that is compatible with a given press. */
export interface ReverseEntry {
  moldId: string;
  designation: string;
  decision: CompatibilityResult['decision'];
  requiresAdaptation: boolean;
  blockingRuleLabels: string[];
}

export function reverseSearch(press: Press, molds: Mold[]): ReverseEntry[] {
  return molds.map((mold) => {
    const result = checkCompatibility(press, mold);
    return {
      moldId: mold.id,
      designation: mold.designation,
      decision: result.decision,
      requiresAdaptation: result.requiresAdaptation,
      blockingRuleLabels: result.blockingRules.map((r) => r.label),
    };
  });
}

/** Convenience: only the compatible press IDs for a mold. */
export function compatiblePresses(mold: Mold, presses: Press[]): string[] {
  return compatibilityMatrix(mold, presses)
    .filter((e) => e.decision === 'COMPATIBLE')
    .map((e) => e.pressId);
}

/** Convenience: only the compatible mold IDs for a press. */
export function compatibleMolds(press: Press, molds: Mold[]): string[] {
  return reverseSearch(press, molds)
    .filter((e) => e.decision === 'COMPATIBLE')
    .map((e) => e.moldId);
}
