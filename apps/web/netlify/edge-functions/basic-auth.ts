import type { Config, Context } from '@netlify/edge-functions';

/**
 * Site-wide HTTP Basic Auth gate (runs on Netlify's edge, before any page is
 * served). Credentials come from Netlify environment variables and are never
 * shipped to the browser:
 *   - BASIC_AUTH_USER
 *   - BASIC_AUTH_PASSWORD
 *
 * If either variable is unset the gate stays OPEN, so a deploy can't lock you
 * out before you've configured it. Set both variables in Netlify
 * (Site settings → Environment variables) and redeploy to enable protection.
 */
export default async (request: Request, _context: Context): Promise<Response | void> => {
  const user = Netlify.env.get('BASIC_AUTH_USER');
  const pass = Netlify.env.get('BASIC_AUTH_PASSWORD');

  // Protection not configured yet → let the request through.
  if (!user || !pass) return;

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
