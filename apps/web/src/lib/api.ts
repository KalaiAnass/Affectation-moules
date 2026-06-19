import type {
  AuditItem,
  CompatibilityResult,
  MatrixEntry,
  Mold,
  Press,
  ReverseEntry,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) },
    });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${BASE}. Is it running?`);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch {
      /* keep default */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  base: BASE,
  presses(): Promise<Press[]> {
    return request('/presses');
  },
  molds(): Promise<Mold[]> {
    return request('/molds');
  },
  check(pressId: string, moldId: string): Promise<CompatibilityResult> {
    return request('/compatibility/check', {
      method: 'POST',
      body: JSON.stringify({ pressId, moldId }),
    });
  },
  matrix(moldId: string): Promise<{ mold: Mold; entries: MatrixEntry[] }> {
    return request(`/compatibility/matrix/${encodeURIComponent(moldId)}`);
  },
  reverse(pressId: string): Promise<{ press: Press; entries: ReverseEntry[] }> {
    return request(`/compatibility/reverse/${encodeURIComponent(pressId)}`);
  },
  audit(skip = 0, take = 50): Promise<{ total: number; items: AuditItem[] }> {
    return request(`/audit?skip=${skip}&take=${take}`);
  },
};
