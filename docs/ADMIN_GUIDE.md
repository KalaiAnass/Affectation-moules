# Administrator Guide

## Deployment (Docker Compose)

```bash
cp .env.example .env             # set strong secrets; ALLOW_DEV_LOGIN=false for prod
docker compose up -d --build     # postgres + api + web
docker compose run --rm seed     # migrate + seed dataset & users (first run only)
```

Services:

| Service | Port | Notes |
|---------|------|-------|
| web | 3000 | Next.js (standalone) |
| api | 3001 | NestJS; runs `prisma migrate deploy` on start |
| db | 5432 | PostgreSQL 16 (volume `db-data`) |

For Kubernetes, the two images (`apps/api/Dockerfile`, `apps/web/Dockerfile`) are
self-contained; supply the same environment variables via ConfigMaps/Secrets and point
`DATABASE_URL` at your managed PostgreSQL.

## Configuring SSO (Azure AD / Entra ID)

1. Register an application in Entra ID; note the **issuer**, **audience** (application/client
   ID or API URI) and the **app roles** you expose.
2. Set on the API:
   ```
   OIDC_ISSUER=https://login.microsoftonline.com/<tenant>/v2.0
   OIDC_AUDIENCE=<api-audience>
   OIDC_ROLES_CLAIM=roles        # or "groups"
   ALLOW_DEV_LOGIN=false
   ```
3. Map Entra app roles to the four application roles: `ADMINISTRATOR`, `ENGINEER`,
   `TECHNICIAN`, `READ_ONLY` (aliases like `Admin`, `Viewer` are accepted).
4. The web front-end should be configured to obtain tokens from Entra and send them as
   `Authorization: Bearer …` (replace the dev login flow with MSAL/NextAuth).

## Roles & permissions

| Role | Check | Matrix / Reverse | Audit history |
|------|:----:|:----------------:|:-------------:|
| Administrator | ✓ | ✓ | ✓ |
| Engineer | ✓ | ✓ | ✓ |
| Technician | ✓ | ✓ | — |
| Read only | ✓ | ✓ | — |

Users are stored in the `users` table. In production they are provisioned from the OIDC
subject on first sign-in (extend `JwtStrategy.validate` to upsert if you want a local
mirror). For the dev login, edit the seed (`apps/api/prisma/seed.mjs`).

## Updating press / mold data

The reference data is generated from the plant workbook — **do not edit the database by
hand** for reference fields, or the next seed will overwrite it.

1. Replace `packages/engine/data/source/equipement-presses.xlsm` with the new workbook.
2. Regenerate: `npm run extract --workspace @mpc/engine`.
3. Review the diff in `packages/engine/data/*.json`, run `npm run test:engine`.
4. Re-seed: `docker compose run --rm seed` (upserts; existing rows are updated).

The column map lives in `packages/engine/scripts/extract.mjs`; the normalisation rules in
`packages/engine/src/normalize.ts`. CI fails if committed data drifts from the workbook.

## Database operations

```bash
# Apply migrations
npm run prisma:migrate --workspace @mpc/api          # migrate deploy (prod)
npm run prisma:migrate:dev --workspace @mpc/api      # create a new migration (dev)

# Inspect data
npx prisma studio --schema apps/api/prisma/schema.prisma
```

Backups: snapshot the `db-data` volume / use managed PITR. The `audit_logs` table is
append-only and should be retained per your compliance policy.

## Monitoring

- `GET /api/v1/health` reports liveness and DB connectivity — wire it to your probes.
- Request logs (method/path/status/duration/user) are emitted on stdout; ship to your log
  platform. The audit trail is queryable via `GET /api/v1/audit` or directly in the DB.

## Operational checklist

- [ ] Secrets set, dev login disabled, TLS in front of both tiers.
- [ ] SSO configured and role mapping verified with a test account per role.
- [ ] Migrations applied; dataset seeded and spot-checked.
- [ ] Backups + log retention configured.
- [ ] `npm audit` / Dependabot green.
