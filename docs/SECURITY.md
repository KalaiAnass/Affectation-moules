# Security Hardening

Target baselines: **OWASP Top 10** and the **NIST Secure Software Development Framework
(SSDF)**. This document records the controls implemented and the operational steps required
for a production deployment.

## Authentication

> **Current state:** the tool ships **open** (no enforced authentication) for frictionless
> use on the shop floor. The full JWT/OIDC + RBAC implementation below lives in
> `apps/api/src/auth`. To enforce it, re-register the guards in `apps/api/src/app.module.ts`:
> ```ts
> { provide: APP_GUARD, useClass: JwtAuthGuard },
> { provide: APP_GUARD, useClass: RolesGuard },
> ```
> and re-import `AuthModule`. The web app's `AuthGate`/login can be restored from git history.

- **Production: OIDC (Azure AD / Entra ID).** Set `OIDC_ISSUER`, `OIDC_AUDIENCE` and
  optionally `OIDC_JWKS_URI`. Tokens are validated as **RS256** against the provider's JWKS
  (`jwks-rsa`, cached & rate-limited). MFA is enforced at the identity provider.
- **Development: local HS256** tokens minted by `POST /auth/token` for seeded demo users.
  This endpoint is **automatically disabled** when `NODE_ENV=production` or when
  `OIDC_ISSUER` is set, and is gated behind `ALLOW_DEV_LOGIN`.
- Tokens are bearer JWTs sent in the `Authorization` header; the API is stateless.

## Authorization (RBAC)

Four roles, enforced by `RolesGuard`:

| Role | Capabilities |
|------|--------------|
| `ADMINISTRATOR` | Everything (implicitly granted all routes) |
| `ENGINEER` | Checks, matrix, reverse, **audit history** |
| `TECHNICIAN` | Checks, matrix, reverse |
| `READ_ONLY` | Checks, matrix, reverse (view only) |

Roles come from the OIDC `roles` claim (configurable via `OIDC_ROLES_CLAIM`). Unknown roles
fall back to least-privilege `READ_ONLY`. All routes require authentication by default; only
`/health` and the dev `/auth/token` are `@Public()`.

## API security controls

| Control | Implementation |
|---------|----------------|
| Security headers / CSP | `helmet` with a restrictive Content-Security-Policy, `frame-ancestors 'none'`, `objectSrc 'none'` |
| HSTS | Enabled in production (`max-age` 180 days, `includeSubDomains`) |
| CORS | Explicit allow-list via `CORS_ORIGINS`; credentials enabled |
| Input validation | Global `ValidationPipe` — `whitelist`, `forbidNonWhitelisted`, type coercion; DTOs use `class-validator` |
| SQL injection | Prisma parameterised queries only; no string-built SQL |
| Rate limiting | `@nestjs/throttler` — 120 req/min/IP (tunable) |
| XSS | React auto-escaping on the web; JSON-only API; CSP on both tiers |
| Error hygiene | Global filter returns a uniform envelope; never leaks stack traces |
| Request logging | Interceptor logs method/path/status/duration/user (never bodies) |
| Auditability | Append-only `audit_logs` with FK integrity |
| Cookies | `cookie-parser` wired; CSRF utilities available for any future cookie-based flows. The current bearer-token API is not CSRF-susceptible |

## Web security controls

- Next.js sends `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  and a restrictive `Permissions-Policy`; `poweredByHeader` disabled.
- No business logic or secrets in the client; only `NEXT_PUBLIC_API_URL` is exposed.

## Secrets & configuration

- All secrets come from environment variables; `.env` files are git-ignored
  (`.env.example` documents every key).
- **Rotate `JWT_SECRET`** and set `ALLOW_DEV_LOGIN=false` before any non-local deployment.
- Use managed secrets (Azure Key Vault / AWS Secrets Manager / Kubernetes Secrets) in prod.

## Production deployment checklist

- [ ] `OIDC_ISSUER`/`OIDC_AUDIENCE` configured; MFA enforced at the IdP.
- [ ] `ALLOW_DEV_LOGIN=false`, strong unique `JWT_SECRET`.
- [ ] TLS terminated in front of both web and api (ingress / reverse proxy); HSTS on.
- [ ] `CORS_ORIGINS` restricted to the real web origin(s).
- [ ] Database credentials from a secrets manager; least-privilege DB user.
- [ ] Network policy: only the API can reach PostgreSQL.
- [ ] Centralised log shipping & retention for `audit_logs` and request logs.
- [ ] Dependency scanning (`npm audit` / Dependabot) wired into CI.
- [ ] Backups & PITR configured for PostgreSQL.

## OWASP Top 10 mapping (summary)

| Risk | Mitigation |
|------|------------|
| A01 Broken Access Control | Global auth guard + RBAC; deny-by-default |
| A02 Cryptographic Failures | TLS in transit; RS256 OIDC validation; secrets externalised |
| A03 Injection | Prisma parameterised queries; strict input validation |
| A04 Insecure Design | Pure, tested rules engine; least-privilege defaults |
| A05 Security Misconfiguration | Helmet/CSP, disabled dev login in prod, hardened CORS |
| A06 Vulnerable Components | Pinned versions, `npm audit`/Dependabot in CI |
| A07 Auth Failures | OIDC + MFA at IdP; short-lived tokens; no custom crypto |
| A08 Integrity Failures | FK-constrained schema; dataset drift check in CI |
| A09 Logging/Monitoring | Request logging + append-only audit trail |
| A10 SSRF | API makes no user-controlled outbound requests |
