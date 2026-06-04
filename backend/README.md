# Jubely backend (Phase 1)

[![Backend CI](https://github.com/PaulUno777/jubely-saas/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/PaulUno777/jubely-saas/actions/workflows/backend-ci.yml)

Go API for **Option 2 onboarding**: only a **superadmin** creates tenants; **merchant admins** join via **invitation token**. Tenants carry `self_serve` (default `false`) so Phase 3 can enable public registration without schema changes.

## Requirements

- **Go**: projects targets **the latest stable Go** (see `go` / `toolchain` in `go.mod`). CI uses `go-version-file: backend/go.mod`. Upgrade with `go get go@latest` and `go get -u ./...` when you intentionally refresh dependencies.
- PostgreSQL 14+ (Supabase works)

## Composition root (Wire)

API dependencies are wired in [`internal/app`](internal/app) using [Google Wire](https://github.com/google/wire). `cmd/api/main.go` only starts the process; providers live under `internal/app/providers/` (postgres, infra, use cases by domain, HTTP).

After changing providers or `wire.go`, regenerate and commit `wire_gen.go`:

```bash
cd backend
go generate ./internal/app/...
```

## Local dev (Docker Compose)

This repository will host multiple projects, so the compose file is at root:
- `docker-compose.yml`

### Start local stack

```bash
docker compose up --build
```

Services:
- API: `http://localhost:8080`
- PostgreSQL: `localhost:5432` (`jubely` / `jubely`)

### Notes
- `DATABASE_URL` is overridden in compose to use the `postgres` service.
- Keep `backend/.env` for other vars (`JWT_SECRET`, `BOOTSTRAP_SECRET`, etc.).
- Stop stack:

```bash
docker compose down
```

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | Min 32 characters |
| `JWT_ACCESS_TTL_MINUTES` | no | Default `60` |
| `HTTP_PORT` | no | Default `8080` |
| `QR_TOKEN_SECRET` | no | Min 32 chars; defaults to `JWT_SECRET` if omitted (pins QR token signing separately in prod) |
| `BOOTSTRAP_SECRET` | yes for bootstrap | Shared secret for one-time superadmin creation |

Optional: `.env` in `backend/` (loaded via `godotenv`).

## First run (local)

1. Create a database and set `DATABASE_URL`.
2. Start the API: `go run ./cmd/api` from `backend/`.
3. Bootstrap the first superadmin (only while `users` has zero superadmins):

```http
POST /v1/bootstrap/superadmin
X-Bootstrap-Secret: <BOOTSTRAP_SECRET>
Content-Type: application/json

{"email":"super@example.com","password":"change-me-8-chars-min"}
```

4. Login as superadmin:

```http
POST /v1/auth/login
{"email":"super@example.com","password":"..."}
```

5. Create a tenant (`self_serve` is forced to `false` in the HTTP layer for MVP):

```http
POST /v1/superadmin/tenants
Authorization: Bearer <token>
{"name":"Chez Mama","slug":"chez-mama"}
```

6. Invite a merchant admin:

```http
POST /v1/superadmin/tenants/<tenantId>/invitations
Authorization: Bearer <token>
{"email":"merchant@example.com","role":"merchant_admin"}
```

Response includes a **one-time** `token`. Share `GET /v1/invitations/:token` and `POST /v1/invitations/:token/accept` with the merchant.

7. (Optional) Create a staff user for a tenant (not automated in Phase 1): insert a `users` row in Postgres with `role='staff'` for the tenant, then login with `tenant_slug` set to that tenant.

8. Create a customer (staff or merchant admin token required):

```http
POST /v1/staff/customers
Authorization: Bearer <token>
Content-Type: application/json

{"name":"Awa Diop","phone_e164":"+221771234567","email":"awa@example.com"}
```

Response includes `customer_qr` (HMAC token string) for client display in early phases.

9. Generate a store QR (superadmin token required). This token can be printed/displayed in the store for self-enrollment.

```http
GET /v1/superadmin/tenants/<tenantId>/store-qr
Authorization: Bearer <token>
```

10. Enroll by scanning a store QR:

```http
POST /v1/public/enrollments
Content-Type: application/json

{"store_qr":"<storeQrToken>","phone_e164":"+221771234567","name":"Awa Diop"}
```

Response includes `customer_qr` for client display.

## JSON API (Phase 1 envelope)

All JSON responses use a stable envelope. **`error.message` is localized** from the `Accept-Language` header (supported: `en`, `fr`; fallback `en`). Clients may send **`X-Request-Id`**; otherwise the server generates one and echoes it in `meta`.

**Success (single resource)**

```json
{ "data": { }, "meta": { "request_id": "…", "locale": "fr" } }
```

**Success (list / paginated)**

```json
{
  "data": [ ],
  "meta": {
    "request_id": "…",
    "locale": "fr",
    "pagination": { "limit": 20, "offset": 0, "total": 123 }
  }
}
```

**Error**

```json
{
  "error": { "code": "error.validation.invalid", "message": "…", "details": { } },
  "meta": { "request_id": "…", "locale": "fr" }
}
```

`error.details` is optional and machine-oriented (stable keys, no user-facing prose). CORS allows and exposes `Accept-Language` and `X-Request-Id` for browser clients.

Manual QA order and UI targets for this iteration are documented under [`context/phase1/`](../context/phase1/) (see `recommandation.md` and screenshots).

## Tenant-scoped merchant API (REST)

Merchant admin routes are scoped under **`/v1/tenants/:tenantId/*`**. The JWT `tenant_id` must match `:tenantId`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/tenants/:tenantId/metrics?period=7d\|30d&location_id=` | KPI cards + sparklines |
| `GET` | `/v1/tenants/:tenantId/metrics/loyalty-activity` | Daily distributed vs rewarded series |
| `GET` | `/v1/tenants/:tenantId/stats` | Sidebar resource counts |
| `GET` | `/v1/tenants/:tenantId/locations` | List physical locations |
| `POST` | `/v1/tenants/:tenantId/locations` | Create location (address + optional coordinates) |
| `PATCH` | `/v1/tenants/:tenantId/locations/:locationId` | Mark location as headquarters (`{ "is_hq": true }`) |

Public discovery (no auth):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/public/locations/nearby` | Precise (`lat`+`lng`) or coarse (`country_code`+`city`) |

**Naming:** SaaS account = **tenant**; physical boutique = **location** (Postgres `locations`, French UI **boutique**). The merchant portal path prefix `/store/*` is the admin shell only—not the domain resource. Legacy `/v1/store/*` and `/v1/organizations/me/*` remain until clients migrate. Merchant UI route for boutiques: **`/store/locations`**.

## Migrations

Embedded goose SQL runs on API startup ([`internal/migrate`](internal/migrate)). The baseline is **four files** (concern order):

| File | Domain |
|------|--------|
| `001_core_auth.sql` | Organizations (`tenants`), users, memberships, MFA, refresh tokens |
| `002_locations.sql` | Physical locations (`locations`), `location_memberships`, HQ flag, geo index |
| `003_loyalty.sql` | `customer_identities`, `loyalty_enrollments`, `point_events`, `points_rules` |
| `004_rewards_billing.sql` | Rewards, redemptions, `plan_catalog`, subscriptions, invoices |

Legacy tables `customers` / `enrollments` from early prototypes are **not** created. HQ stores and trial subscriptions are created by the app (`ProvisionOrganization` on org signup), not by migration backfills.

**After changing migration files**, reset the database (pre-production):

```bash
dropdb jubely && createdb jubely
# or: psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Then start the API or run `go run ./cmd/migrate` from `backend/`. Do not rely on goose Down across squashed files—prefer a fresh DB.

## CI

GitHub Actions workflow: `.github/workflows/backend-ci.yml` (`go test`, `go vet`, `go build`).
