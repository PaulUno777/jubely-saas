# Phase 1 manual validation

Use this checklist after API and web are running with a fresh or known database.

**Roadmap:** see [ROADMAP.md](./ROADMAP.md) for phase status and what remains. **Phase 3:** [phase3-validation.md](./phase3-validation.md).

## Prerequisites

1. **Database** migrated (API runs goose on startup).
2. **API** listening (e.g. `http://localhost:8082` if mapped via Docker).
3. **Web** `NEXT_PUBLIC_API_BASE_URL` (or `API_BASE_URL`) points at that API origin.
4. **Superadmin** exists (`POST /v1/setup/superadmin` with bootstrap secret, or auto-seed env if enabled).

## Flow

1. Open the web app (e.g. `http://localhost:3003`), go to **Login**.
2. Sign in as **superadmin**; you should land on **`/root`**.
3. Confirm **sidebar** shows live **tenant total** and **alerts** badges when stats load; open **Revenue**, **Users**, **Subscriptions**, **Plans**, **Integrations**, **System health**, and **Audit** — each should show a **Coming soon** placeholder (no dead links to generic `/root` except global overview).
4. **Tenants** → create a tenant (e.g. “Chez Mama”), open its **detail**, edit fields, **upload/remove logo** (no binary commits in git).
5. Create a **merchant invitation** (or tenant admin), accept invite / sign in as **merchant admin** → **`/store`**.
6. On **`/store`**, confirm **tenant name/plan** in the shell header; **sidebar footer** and **dashboard** show **points distributed** and **point events this month** from `GET /v1/tenants/:tenantId/metrics` (zeros until `point_events` exist).

## Automated smoke (optional)

From `apps/web` with dev server on `127.0.0.1:3003`:

```bash
pnpm exec playwright install
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003 pnpm test:e2e
```

The smoke test only asserts the **login** page loads (no credentials required).

## Automated backend checks

Run `cd backend && go test ./...` for JWT permission claims, `RequirePermission` middleware, staff purchase tenant isolation, enrollment phone proof, and public OTP verify.
