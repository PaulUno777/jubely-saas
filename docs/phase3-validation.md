# Phase 3 manual validation — enrollment & purchases

Use after [phase1-validation.md](./phase1-validation.md) and with auth BFF cookies enabled.

## Prerequisites

1. API running with migrations applied (`cd backend && go run ./cmd/api` or Docker).
2. Web app running (`pnpm --dir apps/web dev`).
3. **Web env:** `API_INTERNAL_BASE_URL=http://localhost:8082` (or your API origin).
4. **API env (dev OTP):** `PUBLIC_OTP_LOG_CODE=true` to print OTP codes in API logs.
5. Tenant exists with slug (e.g. `chez-mama`) and at least one **staff** user.

## Flow A — PWA enrollment (`/join/:slug`)

1. Open `http://localhost:3000/join/chez-mama` (adjust port/slug).
2. Confirm tenant name/logo loads from `GET /v1/public/tenant/:slug`.
3. Enter phone (E.164, e.g. `+237611111111`), request OTP, read code from API logs if needed.
4. Verify OTP, enter name, submit enrollment.
5. Expect success toast and redirect toward customer wallet; customer QR token stored locally.

## Flow B — Agent creates customer

1. Log in as **staff** for the tenant → `/agent`.
2. Open **Create customer**, submit name + phone + optional email.
3. Confirm `customer_qr` token is shown.

## Flow C — Agent records purchase

1. Still as staff, open **Record purchase** (`/agent/purchase`) from the agent home or sidebar.
2. Enter the same phone as Flow A or B (E.164 format).
3. Enter amount **4500** FCFA → expect **+9 points** (1 point per 500 FCFA).
4. Confirm toast and result card show points awarded.

## Flow D — Merchant metrics

1. Log in as **merchant_admin** for the tenant → `/store`.
2. Dashboard and sidebar footer should show non-zero **points distributed** and **point events this month** after Flow C.

## Automated backend checks

```bash
cd backend && go test ./...
```

Covers staff purchase isolation, public OTP verify, enrollment phone proof.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 401 on API calls | Session cookies; `credentials: "include"`; BFF `/api/v1` proxy |
| Purchase 404 on customer | Phone must match enrolled customer for this tenant |
| OTP never arrives | `PUBLIC_OTP_LOG_CODE=true`; in-memory store is dev-only |
| 0 points for small amount | Amount must be ≥ 500 FCFA for at least 1 point |
