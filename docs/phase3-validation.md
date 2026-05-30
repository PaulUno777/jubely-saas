# Phase 3 manual validation — enrollment & purchases

Use after [phase1-validation.md](./phase1-validation.md) and with auth BFF cookies enabled.

## Prerequisites

1. API running with migrations applied (`docker compose up` or `cd backend && go run ./cmd/api`).
   - **Docker Compose:** backend is published as `http://localhost:8082` (`8082:8080` in `docker-compose.yml`). `HTTP_PORT=8080` in `backend/.env` is only the in-container port.
2. Web app running (`pnpm dev:web`).
3. **Web env** (`apps/web/.env.local`):
   - `API_INTERNAL_BASE_URL=http://localhost:8082`
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8082`
   - `COOKIE_SECURE=false` (required for login cookies on `http://localhost`)
4. **API env (dev OTP):** `PUBLIC_OTP_LOG_CODE=true` to print OTP codes in API logs.
5. Seed data (optional one-shot):

```bash
pnpm dev:seed
```

Creates superadmin, tenant `chez-mama`, merchant admin, agent, sample customer, and a **4500 FCFA** purchase (**45 points** at default 1 pt / 100 FCFA). Re-running may fail on duplicate tenant/email — use fresh DB or adjust env vars in `scripts/dev-seed.mjs`.

The script reads `BOOTSTRAP_SECRET` from `backend/.env` and picks the API URL from `API_BASE`, `API_PUBLIC_BASE`, `PUBLIC_FILE_BASE_URL`, or `docker-compose.yml` (`8082:8080`). Override with `API_BASE=http://localhost:8082 pnpm dev:seed` if needed.

## Flow A — PWA enrollment (`/join/:slug`)

1. Open `http://localhost:3000/join/chez-mama` (adjust port/slug).
2. Confirm tenant name/logo loads from `GET /v1/public/tenant/:slug`.
3. Enter phone (E.164, e.g. `+237611111111`), request OTP, read code from API logs if needed.
4. Verify OTP, enter name, submit enrollment.
5. Expect success toast and redirect toward customer wallet; customer QR token stored locally.
6. Open `/customer/wallet` — balance (0 pts initially), tier, QR, and history after a purchase.

## Flow B — Staff invite (optional)

1. As **merchant_admin**, invite an agent on `/store/agents` and copy the activation link.
2. Open `/invite/{token}` in a private window, set a password.
3. Sign in at `/login` with store slug, invited email, and new password → `/agent`.

## Flow C — Agent creates customer

1. Log in as **staff** for the tenant → `/agent`.
2. Open **Create customer**, submit name + phone + optional email.
3. Confirm `customer_qr` token is shown.

## Flow D — Agent records purchase

1. Still as staff, open **Record purchase** (`/agent/purchase`) from the agent home or sidebar.
2. Enter the same phone as Flow A or C (E.164 format).
3. Enter amount **4500** FCFA → expect **+45 points** (default rule: 1 point per 100 FCFA), or scan customer QR from wallet.
4. Confirm toast and result card show points awarded.

## Flow E — Merchant metrics & lists

1. Log in as **merchant_admin** for the tenant → `/store`.
2. Dashboard and sidebar footer should show non-zero **points distributed** and **point events this month** after the purchase flow.
3. Open `/store/customers` — enrolled customer(s) with point balance.
4. Open `/store/transactions` — `earn` row with amount and delta.

## Flow F — Reward claim & validate (Phase 4)

1. As merchant admin, create a reward on `/store/rewards` (e.g. 50 pts).
2. As customer with balance, open `/customer/rewards`, claim → claim QR on `/customer/qr`.
3. As staff, scanner **Validate** mode → `/agent/validate` → confirm burn.

## Automated backend checks

```bash
cd backend && go test ./...
```

Covers staff purchase isolation, public OTP verify, enrollment phone proof.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 401 on API calls | Session cookies; `credentials: "include"`; BFF `/api/v1` proxy |
| Login works but APIs 401 | `COOKIE_SECURE=false` on `http://localhost`; cookies not stored |
| Red `GET /api/auth/me` in console (old builds) | Expected when logged out; `/api/auth/me` returns `200` + `data: null` (not proxied to Go) |
| Purchase 404 on customer | Phone must match enrolled customer for this tenant |
| OTP never arrives | `PUBLIC_OTP_LOG_CODE=true`; in-memory store is dev-only |
| 0 points for small amount | Amount must be ≥ 500 FCFA for at least 1 point |
