import type { Config, Context } from '@netlify/edge-functions';

/**
 * Site-wide login gate at Netlify's edge (runs before any page is served).
 * Shows a branded FORVIA login page (white + blue) and grants a session cookie
 * on success — no ugly browser popup.
 *
 * This is a duplicate of apps/web/netlify/edge-functions/basic-auth.ts placed at
 * the repo root so the gate works whether the Netlify "base directory" is the
 * repo root or apps/web. Only the copy under the configured base directory runs;
 * keep both in sync.
 *
 * Default credentials below; override without code changes via Netlify env vars
 * BASIC_AUTH_USER / BASIC_AUTH_PASSWORD.
 */
const DEFAULT_USER = 'Faurecia';
const DEFAULT_PASS = '7799';
const COOKIE = 'mpc_auth';

const sessionToken = (user: string, pass: string): string => btoa(`${user}:${pass}`);

function hasValidCookie(cookieHeader: string, expected: string): boolean {
  return cookieHeader.split(/;\s*/).some((c) => {
    const i = c.indexOf('=');
    return i !== -1 && c.slice(0, i) === COOKIE && c.slice(i + 1) === expected;
  });
}

function loginPage(error: boolean): string {
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>FORVIA · Connexion</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  :root{--brand:#0A23CA;--indigo:#29338A;--sky:#619FD8;--ink:#0B1020;--muted:#5b6480;--paper:#F5F7FD;--line:#E2E8F5;}
  *{box-sizing:border-box;}
  body{margin:0;min-height:100vh;font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--paper);
    background-image:radial-gradient(64rem 64rem at 85% -15%,rgba(10,35,202,.10),transparent 60%),
                     radial-gradient(52rem 52rem at -10% 5%,rgba(97,159,216,.12),transparent 55%);
    display:grid;place-items:center;padding:24px;}
  .card{width:100%;max-width:400px;background:#fff;border:1px solid var(--line);border-radius:20px;
    box-shadow:0 24px 64px rgba(10,35,202,.16);padding:32px;}
  .brand{display:flex;align-items:center;gap:12px;}
  .word{font-family:Archivo,sans-serif;font-weight:800;font-size:22px;letter-spacing:-.02em;color:var(--brand);}
  .sep{width:1px;height:18px;background:var(--line);}
  .subtitle{font-size:13px;font-weight:500;color:var(--indigo);}
  .kicker{margin:22px 0 4px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);}
  h1{margin:0 0 18px;font-family:Archivo,sans-serif;font-size:24px;letter-spacing:-.02em;}
  label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:14px 0 6px;}
  input{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:14px;font-size:15px;font-family:inherit;background:#fff;outline:none;}
  input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(10,35,202,.12);}
  button{width:100%;margin-top:22px;padding:13px;border:0;border-radius:999px;background:var(--brand);color:#fff;
    font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s;}
  button:hover{background:var(--indigo);}
  .err{margin-top:16px;padding:10px 12px;border-radius:12px;background:#fbecea;color:#c0382b;font-size:13px;}
  .foot{margin-top:18px;text-align:center;font-size:12px;color:var(--muted);}
</style></head>
<body>
  <form class="card" method="POST" action="/__auth">
    <div class="brand"><span class="word">FORVIA</span><span class="sep"></span><span class="subtitle">Moule ↔ Presse</span></div>
    <div class="kicker">Hénin-Beaumont</div>
    <h1>Accès sécurisé</h1>
    <label for="u">Nom d'utilisateur</label>
    <input id="u" name="username" autocomplete="username" autofocus required />
    <label for="p">Mot de passe</label>
    <input id="p" name="password" type="password" autocomplete="current-password" required />
    ${error ? '<div class="err">Identifiant ou mot de passe incorrect.</div>' : ''}
    <button type="submit">Se connecter</button>
    <div class="foot">Plateforme de compatibilité moule / presse</div>
  </form>
</body></html>`;
}

const htmlResponse = (html: string, status = 200): Response =>
  new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export default async (request: Request, _context: Context): Promise<Response | void> => {
  const user = Netlify.env.get('BASIC_AUTH_USER') || DEFAULT_USER;
  const pass = Netlify.env.get('BASIC_AUTH_PASSWORD') || DEFAULT_PASS;
  const expected = sessionToken(user, pass);
  const url = new URL(request.url);

  // Already signed in.
  if (hasValidCookie(request.headers.get('cookie') ?? '', expected)) return;

  // Handle the login form submission.
  if (request.method === 'POST' && url.pathname === '/__auth') {
    const form = await request.formData();
    const u = String(form.get('username') ?? '');
    const p = String(form.get('password') ?? '');
    if (u === user && p === pass) {
      return new Response(null, {
        status: 303,
        headers: {
          // Session cookie (no Max-Age/Expires): the login is required again
          // every time the browser is (re)opened — it is not remembered.
          Location: '/',
          'Set-Cookie': `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return htmlResponse(loginPage(true));
  }

  // Not signed in → show the branded login page.
  return htmlResponse(loginPage(false));
};

export const config: Config = { path: '/*' };
