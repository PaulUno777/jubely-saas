# Production deploy (pilot)

Stack: **Supabase** (Postgres) · **Fly.io** (Go API) · **Vercel** (Next.js portals).

## 1. Supabase

1. Create a project and copy the **connection string** (`DATABASE_URL`).
2. Run migrations locally against prod once: `DATABASE_URL=... go run ./cmd/api` (migrations run on boot) or use `goose` from `backend/internal/migrate`.

## 2. Fly.io API

```bash
cd backend
fly apps create jubely-api   # once
fly secrets set \
  DATABASE_URL='postgres://...' \
  JWT_SECRET='...' \
  QR_TOKEN_SECRET='...' \
  BOOTSTRAP_SECRET='...' \
  PUBLIC_OTP_LOG_CODE=true
fly deploy
```

Health: `GET https://<app>.fly.dev/health`

## 3. Vercel (monorepo)

1. Import repo; set **Root Directory** to `apps/web`.
2. Environment:
   - `API_BASE_URL` = `https://<app>.fly.dev`
   - `NEXT_PUBLIC_*` as needed for client-side URLs
3. Deploy; ensure `/api/v1/*` BFF proxies to Fly.

## 4. Bootstrap superadmin

```bash
curl -X POST https://<app>.fly.dev/v1/setup/superadmin \
  -H "X-Bootstrap-Secret: $BOOTSTRAP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

Or set `BOOTSTRAP_AUTO_SEED=true` with `BOOTSTRAP_SUPERADMIN_EMAIL` / `BOOTSTRAP_SUPERADMIN_PASSWORD` on first boot.

## 5. Smoke (architecture flows 1–3)

| Flow | Steps |
|------|--------|
| 1 Join | Public OTP (`PUBLIC_OTP_LOG_CODE=true` → code in API logs) → `POST /v1/public/enrollments` |
| 2 Award | Staff login → scan customer QR → `POST /v1/staff/transactions` |
| 3 Claim | Customer `POST /v1/customers/me/rewards/:id/claims` → staff `POST /v1/staff/redemptions/validate` |

## CI secrets

- `FLY_API_TOKEN` — Fly deploy workflow
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — Vercel workflow
