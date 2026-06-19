/**
 * Canonical dataset accessors. The data itself is generated from the workbook
 * by scripts/extract.mjs into dataset.generated.ts (typed & bundler-safe).
 */
import { MOLDS, PRESSES } from './dataset.generated.js';
import type { Mold, Press } from './types.js';

export { PRESSES, MOLDS };

const pressIndex = new Map<string, Press>(PRESSES.map((p) => [p.id, p]));
const moldIndex = new Map<string, Mold>(MOLDS.map((m) => [m.id, m]));

export function getPress(id: string): Press | undefined {
  return pressIndex.get(id);
}

export function getMold(id: string): Mold | undefined {
  return moldIndex.get(id);
}

export function listPresses(): Press[] {
  return PRESSES;
}

export function listMolds(): Mold[] {
  return MOLDS;
}
