# Mold ↔ Press Compatibility Platform

Industrial web application that determines whether a plastic injection **mold** can be
mounted on a given injection **press**. It replaces the manual compatibility analysis
performed by technicians and process engineers at **Forvia Hénin-Beaumont**.

Every decision is **fully explainable**: the platform evaluates ten engineering rules and
returns, for each, the press value, the mold value, and the reason — plus any required
adaptation (rotation, centering washer, locating studs…).

> Built from the plant's own `Équipement des presses` workbook. The 26 presses and 16
> molds shipped as seed data are extracted directly from that file and validated against
> its own worked example (`2700T2 × 978 → NOT COMPATIBLE`, heating zones 72 < 85).

---

## Monorepo layout

```
packages/engine   Pure-TypeScript rules engine + canonical dataset (no runtime deps)
apps/api          NestJS REST API · Prisma/PostgreSQL · OpenAPI · JWT/OIDC · RBAC · audit
apps/web          Next.js front-end · TypeScript · Tailwind · Framer Motion
docs/             Architecture, security, API, user & admin guides
```

## The ten rules

| # | Rule | Check |
|---|------|-------|
| 1 | Thickness | `minThickness ≤ Em ≤ maxThickness` |
| 2–4 | Mountability | standard / rotated (adaptation) / impossible entry, 5 mm clearance |
| 5 | Bridage (MAG) | same MAG + studs → pass; else centering washer (adaptation) |
| 6 | Heating zones | `press ≥ mold` |
| 7 | Hydraulic cores | `press PF ≥ mold PF` and `press PM ≥ mold PM` |
| 8 | Thermoregulation | `press PF/PM/grid ≥ mold PF/PM/grid` |
| 9 | Sequential control | `press outputs ≥ mold nozzles` (NA = 0) |
| 10 | Clamping force | `press ≥ mold required` |

Any **FAIL** ⇒ `NOT COMPATIBLE`. Only **PASS/ADAPTATION** ⇒ `COMPATIBLE`.

## Quick start (Docker)

```bash
cp .env.example .env            # adjust secrets
docker compose up -d --build    # starts postgres + api + web
docker compose run --rm seed    # one-off: migrate + seed the dataset & demo users
# Web:  http://localhost:3000
# API:  http://localhost:3001/api/v1   (Swagger at /api/docs)
```

The tool is **open — no sign-in required**. Just pick a press and a mold and check.
(An OIDC/Entra ID + RBAC layer ships in `apps/api/src/auth` but is **not enforced**; see
[docs/SECURITY.md](docs/SECURITY.md) to turn it on.)

## Quick start (local dev)

```bash
npm install
npm run build:engine            # build the shared engine first
npm run test:engine             # 24 tests incl. the workbook example

# API (needs a Postgres on DATABASE_URL — see apps/api/.env.example)
cp apps/api/.env.example apps/api/.env
npm run prisma:migrate:dev --workspace @mpc/api
npm run db:seed --workspace @mpc/api
npm run dev:api                 # http://localhost:3001/api/v1

# Web
cp apps/web/.env.example apps/web/.env
npm run dev:web                 # http://localhost:3000
```

## Refreshing the dataset

The dataset is generated from the vendored workbook; it is never hand-edited:

```bash
npm run extract --workspace @mpc/engine   # re-reads packages/engine/data/source/*.xlsm
```

CI fails if the committed dataset drifts from the workbook.

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm run test:engine` | Run the engine unit/integration tests |
| `npm run build:engine` | Build the dual-format engine package |
| `npm run extract` | Regenerate the dataset from the workbook |
| `npm run dev:api` / `dev:web` | Run API / web in watch mode |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security hardening (OWASP / NIST)](docs/SECURITY.md)
- [API reference](docs/API.md)
- [User guide](docs/USER_GUIDE.md)
- [Administrator guide](docs/ADMIN_GUIDE.md)

## Performance

The engine is pure and synchronous: a single check evaluates all ten rules in microseconds
(well under the 100 ms target); a full 26-press matrix is a few hundred microseconds.
