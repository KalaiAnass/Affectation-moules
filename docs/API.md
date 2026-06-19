# API Reference

Base URL: `http://localhost:3001/api/v1` · Interactive docs: `/api/docs` ·
OpenAPI JSON: `/api/docs-json`

All endpoints require `Authorization: Bearer <token>` except where marked **public**.

## Auth

### `POST /auth/token` — dev login (public)
Disabled in production / when OIDC is configured.
```json
// request
{ "email": "engineer@forvia.local" }
// response
{ "accessToken": "eyJ…", "user": { "email": "engineer@forvia.local", "role": "ENGINEER" } }
```

### `GET /auth/me`
Returns the authenticated principal `{ userId, email, name?, roles[] }`.

## Reference data

### `GET /presses` · `GET /presses/:id`
List all presses / fetch one (e.g. `2700T2`).

### `GET /molds` · `GET /molds/:id`
List all molds / fetch one (e.g. `978`).

## Compatibility

### `POST /compatibility/check`
Evaluate one mold against one press. **Audited.**
```json
// request
{ "pressId": "2700T2", "moldId": "978" }
```
```json
// response (abridged)
{
  "pressId": "2700T2",
  "moldId": "978",
  "decision": "NOT_COMPATIBLE",
  "requiresAdaptation": true,
  "rules": [
    { "rule": "thickness", "label": "Thickness", "labelFr": "Épaisseur",
      "status": "PASS", "press": "692–1892 mm", "mold": "1482 mm",
      "details": "Mold 1482 mm within press window 692–1892 mm." },
    { "rule": "heatingZones", "label": "Heating Zones", "labelFr": "Zones de chauffe",
      "status": "FAIL", "press": "72", "mold": "85",
      "details": "Insufficient: press 72 < mold 85." }
    /* … 6 more rules … */
  ],
  "blockingRules": [ { "rule": "heatingZones", "…": "…" } ]
}
```

`status` ∈ `PASS | FAIL | ADAPTATION`. Each rule carries the press value, the mold value,
a human explanation, and an `instruction` when an adaptation is required.

### `GET /compatibility/matrix/:moldId`
One mold vs. all presses.
```json
{ "mold": { "...": "..." },
  "entries": [ { "pressId": "2700T2", "decision": "NOT_COMPATIBLE",
                 "requiresAdaptation": true, "blockingRuleLabels": ["Heating Zones"] } ] }
```

### `GET /compatibility/reverse/:pressId`
One press vs. all molds (same entry shape, keyed by `moldId` + `designation`).

## Audit

### `GET /audit?skip=0&take=50` — **ADMINISTRATOR / ENGINEER**
```json
{ "total": 128, "skip": 0, "take": 50,
  "items": [ { "id": "…", "createdAt": "…", "userEmail": "…",
               "pressId": "2700T2", "moldId": "978",
               "decision": "NOT_COMPATIBLE", "requiresAdaptation": true } ] }
```

## Health

### `GET /health` — public
`{ "status": "ok", "db": "up", "timestamp": "…" }`

## Errors

Uniform envelope:
```json
{ "statusCode": 404, "error": "NOT_FOUND",
  "message": "Press \"9999\" not found",
  "path": "/api/v1/...", "timestamp": "…" }
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error (bad/extra fields) |
| 401 | Missing/invalid token |
| 403 | Authenticated but role not permitted |
| 404 | Unknown press/mold |
| 429 | Rate limit exceeded |
