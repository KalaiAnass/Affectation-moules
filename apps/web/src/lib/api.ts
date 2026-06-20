/**
 * Client data layer. The tool runs **fully in the browser** using the vendored
 * engine (./engine) and the baked-in dataset — no backend or database — so it
 * deploys as a static site. The async `api.*` shape is kept so components don't
 * care whether the data is local or remote.
 *
 * To point at the real NestJS API instead (on-prem with PostgreSQL + audit DB),
 * set NEXT_PUBLIC_API_URL and swap this module for a fetch-based client.
 */
import {
  MOLDS,
  PRESSES,
  checkCompatibility,
  compatibilityMatrix,
  getMold,
  getPress,
  reverseSearch,
} from './engine';
import type { AuditItem, CompatibilityResult, MatrixEntry, Mold, Press, ReverseEntry } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const pressesSorted = (): Press[] => [...PRESSES].sort((a, b) => b.clampingForce - a.clampingForce);
const moldsSorted = (): Mold[] => [...MOLDS].sort((a, b) => a.id.localeCompare(b.id));

// --- localStorage-backed audit (this browser only) ---
const AUDIT_KEY = 'mpc.audit';
function readAudit(): AuditItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(AUDIT_KEY) ?? '[]') as AuditItem[];
  } catch {
    return [];
  }
}
function recordAudit(result: CompatibilityResult): void {
  if (typeof window === 'undefined') return;
  const item: AuditItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    action: 'CHECK_COMPATIBILITY',
    userEmail: null,
    pressId: result.pressId,
    moldId: result.moldId,
    decision: result.decision,
    requiresAdaptation: result.requiresAdaptation,
    ip: null,
  };
  const all = [item, ...readAudit()].slice(0, 200);
  window.localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
}

export const api = {
  async presses(): Promise<Press[]> {
    return pressesSorted();
  },
  async molds(): Promise<Mold[]> {
    return moldsSorted();
  },
  async check(pressId: string, moldId: string): Promise<CompatibilityResult> {
    const press = getPress(pressId);
    const mold = getMold(moldId);
    if (!press) throw new ApiError(404, `Press "${pressId}" not found`);
    if (!mold) throw new ApiError(404, `Mold "${moldId}" not found`);
    const result = checkCompatibility(press, mold);
    recordAudit(result);
    return result;
  },
  async matrix(moldId: string): Promise<{ mold: Mold; entries: MatrixEntry[] }> {
    const mold = getMold(moldId);
    if (!mold) throw new ApiError(404, `Mold "${moldId}" not found`);
    return { mold, entries: compatibilityMatrix(mold, pressesSorted()) };
  },
  async reverse(pressId: string): Promise<{ press: Press; entries: ReverseEntry[] }> {
    const press = getPress(pressId);
    if (!press) throw new ApiError(404, `Press "${pressId}" not found`);
    return { press, entries: reverseSearch(press, moldsSorted()) };
  },
  async audit(skip = 0, take = 50): Promise<{ total: number; items: AuditItem[] }> {
    const all = readAudit();
    return { total: all.length, items: all.slice(skip, skip + take) };
  },
};
