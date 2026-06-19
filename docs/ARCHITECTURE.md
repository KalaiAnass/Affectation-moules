# Architecture

## Overview

```
            ┌───────────────┐      HTTPS / JWT      ┌──────────────────┐     SQL      ┌────────────┐
  Browser ──▶  Next.js (web) ─────────────────────▶  NestJS (api)      ─────────────▶  PostgreSQL │
            │  Tailwind/FM  │   /api/v1/...         │  + @mpc/engine    │              │  (Prisma)  │
            └───────────────┘                       └──────────────────┘              └────────────┘
                                                            │
                                                            ▼
                                                     append-only audit
```

Three workspaces, one shared engine:

- **`packages/engine`** — the irreplaceable domain core. Pure TypeScript, **zero runtime
  dependencies**, dual-format (ESM + CJS) so it is consumable by both the API and any
  bundler. Contains the ten rules, the decision engine, normalisation helpers, the typed
  dataset, and the reproducible extractor.
- **`apps/api`** — NestJS. Owns persistence, authentication/authorisation, auditing,
  rate-limiting and the OpenAPI contract. Delegates **all** compatibility logic to the
  engine, so the rules have a single source of truth.
- **`apps/web`** — Next.js App Router. Talks to the API over REST. No business logic.

## Why a separate engine package

Compatibility decisions can interrupt production, damage tooling, or create safety issues.
The rules therefore live in one pure, exhaustively tested module that:

- is verified at runtime by 24 tests, including the workbook's own NOK example;
- cannot accidentally diverge between the API, a future batch job, or a CLI;
- is trivial to reason about (no I/O, no framework, deterministic).

## Data flow for a check

1. Web posts `{ pressId, moldId }` to `POST /api/v1/compatibility/check` with a bearer token.
2. `JwtAuthGuard` validates the token (OIDC in prod, HS256 in dev); `RolesGuard` authorises.
3. `CompatibilityService` loads the press and mold rows from PostgreSQL via Prisma.
4. It calls `checkCompatibility(press, mold)` from `@mpc/engine`.
5. The decision is written to the **audit log** (who, when, what, result, IP).
6. The full per-rule result is returned and rendered as animated cards.

## Dataset lifecycle

```
equipement-presses.xlsm ──(scripts/extract.mjs)──▶ presses.json / molds.json
                                                  └▶ src/dataset.generated.ts ──▶ DB seed
```

The workbook is vendored under `packages/engine/data/source/`. The extractor unzips the
OOXML, applies the documented column map and the shared normalisation (composites like
`2+1 → 3`, `NA → 0`, `#REF! → null`, `MAG 3 → MAG3`, 2-digit years → 19xx) and emits both
human-readable JSON (for DB seeding / inspection) and a typed module (for the engine). CI
re-runs the extractor and fails on any drift.

## Database model

| Table | Purpose |
|-------|---------|
| `presses` | Press envelope & equipment (1:1 with engine `Press`) |
| `molds` | Mold dimensions & requirements (1:1 with engine `Mold`) |
| `users` | App users; provisioned from OIDC `sub` in production |
| `audit_logs` | Append-only trace; FKs to user/press/mold with `ON DELETE SET NULL` |

Migrations are managed by Prisma (`prisma/migrations`). The baseline `0_init` creates all
tables, enums, indexes and foreign keys.

## Technology choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Rules | Pure TS | Determinism, testability, single source of truth |
| API | NestJS | Structured DI, guards/interceptors, first-class OpenAPI |
| ORM | Prisma | Typed queries, migrations, FK/constraint enforcement |
| DB | PostgreSQL | Integrity (FKs, constraints), audit-friendly |
| Web | Next.js | App Router, standalone output, fast static shell |
| Styling | Tailwind + Framer Motion | Minimal, premium, animated without bespoke CSS |

## Performance budget

| Operation | Target | Reality |
|-----------|--------|---------|
| Single compatibility check (engine) | < 100 ms | µs-scale, pure compute |
| Matrix / reverse (DB + engine) | < 500 ms | one indexed query + N×rules |
| Web first load | < 2 s | static shell, ~137 kB first-load JS |
