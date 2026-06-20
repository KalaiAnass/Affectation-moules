import type { Config, Context } from '@netlify/edge-functions';

/**
 * Site-wide HTTP Basic Auth gate (runs on Netlify's edge, before any page is
 * served). Anyone visiting the site must log in.
 *
 * This is a duplicate of apps/web/netlify/edge-functions/basic-auth.ts placed at
 * the repo root so the gate works whether the Netlify "base directory" is the
 * repo root or apps/web. Only the one under the configured base directory is
 * actually used; keep both in sync.
 *
 * Default credentials are below. Override them without touching the code by
 * setting BASIC_AUTH_USER / BASIC_AUTH_PASSWORD in Netlify environment
 * variables (recommended if the password must stay secret — the repo is public).
 */
const DEFAULT_USER = 'Faurecia';
const DEFAULT_PASS = '7799';

export default async (request: Request, _context: Context): Promise<Response | void> => {
  const user = Netlify.env.get('BASIC_AUTH_USER') || DEFAULT_USER;
  const pass = Netlify.env.get('BASIC_AUTH_PASSWORD') || DEFAULT_PASS;

  const header = request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      decoded = '';
    }
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) return; // authorized → continue to the site
    }
  }

  return new Response('Authentification requise.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="FORVIA - Moule/Presse", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

// Apply to every route.
export const config: Config = { path: '/*' };
