# `@jubely/web` (unified app)

Single Next.js app that adapts layout by **role**:
- `superadmin` → `/root/*`
- `merchant_admin` (store admin) → `/store/*`
- `staff` (agent) → `/agent/*`
- `customer` → `/customer/*`

## Run

```bash
pnpm --dir apps/web dev
```

Default: `http://localhost:3003`.

## Backend endpoints used (Phase2)

- Public store signup: `POST /v1/public/store/signup` (tenant + first store admin)
- Login: `POST /v1/auth/login`
- Root admin tenants: `GET /v1/admin/tenants`
- Store admin agents/users: `GET /v1/store/users`, `POST /v1/store/invitations`
- Agent create customer: `POST /v1/staff/customers`
- Store admin metrics: `GET /v1/store/metrics` (points issued, point events this calendar month)

See [Phase 1 validation checklist](../../docs/phase1-validation.md). Optional E2E: from `apps/web` run `pnpm test:e2e` with `PLAYWRIGHT_BASE_URL` pointing at a running dev server.
