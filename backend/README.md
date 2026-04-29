# Jubely backend (Phase 1)

Go API for **Option 2 onboarding**: only a **superadmin** creates tenants; **merchant admins** join via **invitation token**. Tenants carry `self_serve` (default `false`) so Phase 3 can enable public registration without schema changes.

## Requirements

- Go 1.23+
- PostgreSQL 14+ (Supabase works)

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | Min 32 characters |
| `JWT_ACCESS_TTL_MINUTES` | no | Default `60` |
| `HTTP_PORT` | no | Default `8080` |
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
POST /v1/admin/tenants
Authorization: Bearer <token>
{"name":"Chez Mama","slug":"chez-mama"}
```

6. Invite a merchant admin:

```http
POST /v1/admin/tenants/<tenantId>/invitations
Authorization: Bearer <token>
{"email":"merchant@example.com","role":"merchant_admin"}
```

Response includes a **one-time** `token`. Share `GET /v1/invitations/:token` and `POST /v1/invitations/:token/accept` with the merchant.

## Migrations

Embedded SQL runs on startup (`internal/migrate`). For rapid iteration, use a fresh database if you change `001_init.sql` (idempotent upgrades come in a later iteration).

## CI

GitHub Actions workflow: `.github/workflows/backend-ci.yml` (`go test`, `go vet`, `go build`).
