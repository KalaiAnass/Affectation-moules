/**
 * @mpc/engine — public API.
 *
 * Pure, dependency-free mold-to-press compatibility engine plus the canonical
 * Forvia Hénin-Beaumont dataset. Consumed by the NestJS API and usable directly
 * in any TypeScript runtime.
 */
export type {
  Press,
  Mold,
  RuleResult,
  RuleStatus,
  Decision,
  CompatibilityResult,
} from './types.js';

export {
  CLEARANCE_MM,
  RULE_EVALUATORS,
  ruleThickness,
  ruleMountability,
  ruleMag,
  ruleHeatingZones,
  ruleHydraulicCores,
  ruleThermoregulation,
  ruleSequential,
  ruleClampingForce,
} from './rules.js';

export {
  checkCompatibility,
  compatibilityMatrix,
  reverseSearch,
  compatiblePresses,
  compatibleMolds,
} from './engine.js';
export type { MatrixEntry, ReverseEntry } from './engine.js';

export * from './normalize.js';
export { PRESSES, MOLDS, getPress, getMold, listPresses, listMolds } from './data.js';
