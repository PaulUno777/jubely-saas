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

## Backend endpoints used

REST routes under `/v1/*` (proxied via BFF where cookies are needed). Full inventory: [`backend/docs/api-routes.md`](../../backend/docs/api-routes.md).

| Area | Example paths |
|------|----------------|
| Public signup | `POST /v1/public/merchant-applications` |
| Sessions | `POST /v1/sessions`, `PUT /v1/sessions/current/workspace` |
| Superadmin | `GET /v1/superadmin/tenants` |
| Tenant admin | `GET /v1/tenants/:tenantId/metrics`, `customers`, `transactions`, `subscription`, `invitations` |
| Agent (staff) | `POST /v1/staff/customers`, `POST /v1/staff/transactions` |
| Customer | `POST /v1/customer-sessions`, `GET /v1/customers/me/rewards` |

API clients: `apps/web/src/lib/tenant-admin/`, `agentApi.ts`, `customerApi.ts`, `publicApi.ts`.

See [Phase 1 validation checklist](../../docs/phase1-validation.md). Optional E2E: from `apps/web` run `pnpm test:e2e` with `PLAYWRIGHT_BASE_URL` pointing at a running dev server.
