# Jubelee HTTP API (`/v1`)

Base URL is configured per environment (e.g. `http://localhost:8082/v1`). Responses use JSON envelopes: success `{ "data": ..., "meta": ... }`, errors `{ "error": { "code", "message", "details?" }, "meta": ... }`.

**Web app (Next.js BFF):** the browser calls `http://localhost:3000/api/v1/...` (proxy to Go) and `http://localhost:3000/api/auth/*` (HttpOnly cookies). Staff/merchant JWTs are not stored in `localStorage`.

## Public (no auth)

| Method | Path                         | Description                                                                                      |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| POST   | `/public/merchant-applications` | Self-serve store signup (tenant + first admin)                                                |
| GET    | `/public/files/*filepath`    | Serve uploaded assets                                                                            |
| GET    | `/public/tenant/:slug`       | Public tenant card: name, slug, logo, `store_qr` token for enrollment                            |
| POST   | `/public/phone-verifications` | Request SMS-style OTP (in-memory MVP; use `PUBLIC_OTP_LOG_CODE=true` on API to log codes in dev) |
| POST   | `/public/phone-verifications/:id/confirmations` | Verify OTP; returns `phone_verify_token` for enroll / customer login              |
| POST   | `/public/enrollments`        | Enroll customer via signed `store_qr` (org + store) + phone + name                             |
| GET    | `/public/plans`              | Plan catalog (Standard / Growth / Scale)                                                         |
| POST   | `/sessions`                  | Email + password; optional `tenant_slug` for tenant-scoped users                                 |
| POST   | `/customer-sessions`         | Customer login after OTP verify (`phone_verify_token`)                                           |
| POST   | `/sessions/refresh`          | Refresh access token                                                                             |
| DELETE | `/sessions/current`          | Revoke refresh session                                                                           |
| PUT    | `/sessions/current/workspace`| Select workspace (`membership_id`, optional `active_store_id`)                                   |
| POST   | `/sessions/mfa/totp/verifications` | Complete MFA login                                                                         |
| POST   | `/setup/superadmin`          | One-shot bootstrap (requires `X-Bootstrap-Secret`)                                               |
| GET    | `/invitations/:token`        | Invitation preview                                                                               |
| PATCH  | `/invitations/:token`        | Accept invitation (`{ "status": "accepted", "password": "..." }`)                              |

## Customers (loyalty member)

| Method | Path                         | Auth | Description |
| ------ | ---------------------------- | ---- | ----------- |
| GET    | `/customers/wallet`          | —    | Wallet by query `customer_qr` (MVP device-local QR access) |
| GET    | `/customers/me/wallet`       | Bearer (customer JWT, `active_enrollment_id` set) | Wallet for active enrollment |
| PATCH  | `/customers/me/profile`      | Bearer (customer JWT) | Update customer profile fields |
| PUT    | `/customer-sessions/current` | Bearer (customer JWT) | Set active enrollment in session (`enrollment_id`) |
| POST   | `/customers/me/reward-claims`| Bearer (customer JWT) | Claim reward (`reward_id` in body) |

## Authenticated — superadmin (`Authorization: Bearer`, role `superadmin`)

Group `/v1/superadmin`.

| Method | Path                                        | Description                                                    |
| ------ | ------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/superadmin/tenants`                       | Paginated tenant list                                          |
| POST   | `/superadmin/tenants`                       | Create tenant                                                  |
| GET    | `/superadmin/tenants/:tenantId`             | Tenant detail                                                  |
| PATCH  | `/superadmin/tenants/:tenantId`             | Update tenant (plan, active, settings, logo in settings, etc.) |
| GET    | `/superadmin/tenants/:tenantId/users`       | List tenant users                                              |
| POST   | `/superadmin/tenants/:tenantId/users`       | Create tenant user (e.g. merchant admin)                       |
| POST   | `/superadmin/tenants/:tenantId/invitations` | Create invitation                                              |
| GET    | `/superadmin/tenants/:tenantId/enrollment-qr` | Signed store QR token                                       |
| GET    | `/superadmin/stats`                         | Dashboard stats                                                |
| POST   | `/superadmin/uploads/tenant-logo`           | Multipart tenant logo upload                                   |

## Authenticated — merchant admin (`tenant_id` = organization, optional `active_store_id`)

Group `/v1/organizations/me` (org-wide billing & boutiques).

| Method | Path                                      | Description                                      |
| ------ | ----------------------------------------- | ------------------------------------------------ |
| GET    | `/organizations/me/stores`                | List boutiques                                   |
| POST   | `/organizations/me/stores`                  | Create boutique (quota-enforced)                 |
| GET    | `/organizations/me/subscription`          | Subscription + plan limits                       |
| POST   | `/organizations/me/subscription/invoices` | MoMo pay-by-reference (`JBE-PAY-*`)              |
| POST   | `/organizations/me/subscription/invoices/:invoiceId/confirmations` | Mark invoice paid (MVP manual confirm) |

JWT may include `active_store_id` (staff counter context) and `subscription_status` (`active`, `trialing`, `frozen`, …). Writes are blocked when status is not `active` or `trialing`.

### Merchant tenant API (primary — `/store` portal)

Group `/v1/tenants/:tenantId`. Requires merchant admin JWT with matching `tenant_id` scope.

**Query conventions**

| Param | Used on | Description |
| ----- | ------- | ----------- |
| `from`, `to` | metrics, transactions, analytics | ISO-8601 range (preferred over legacy `period`) |
| `period` | metrics | Legacy fallback: `7d` \| `30d` when `from`/`to` omitted |
| `location_id` | metrics, transactions, analytics, customers | Scope to a boutique |
| `offset`, `limit` | list endpoints | Pagination |
| `event_type` | transactions | Filter ledger by event type |
| `q` | customers | Search by name/phone |
| `active_only` | rewards | Default true; pass `false` to include inactive |

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/tenants/:id/metrics` | Dashboard KPIs |
| GET | `/tenants/:id/metrics/loyalty-activity` | Points distributed vs rewarded series |
| GET | `/tenants/:id/stats` | Sidebar badge counts |
| GET/POST | `/tenants/:id/locations` | List / create locations |
| PATCH | `/tenants/:id/locations/:locationId` | Update location (e.g. set HQ) |
| GET | `/tenants/:id/customers` | Paginated enrolled customers |
| GET | `/tenants/:id/customers/:enrollmentId` | Customer detail |
| POST | `/tenants/:id/customers/:enrollmentId/adjustments` | Manual point adjustment |
| GET | `/tenants/:id/transactions` | Point event ledger |
| GET | `/tenants/:id/agents` | Staff / agent list |
| POST | `/tenants/:id/invitations` | Create staff invitation |
| GET/POST/PATCH | `/tenants/:id/rules` | Rules CRUD |
| POST | `/tenants/:id/rule-simulations` | Simulate rule against sample purchase |
| POST | `/tenants/:id/rule-validations` | Validate rule JSON |
| GET/PUT | `/tenants/:id/tiers/:tierCode` | Upsert loyalty tier by code |
| GET/POST/PATCH | `/tenants/:id/rewards` | Rewards CRUD |
| PUT | `/tenants/:id/rewards/:rewardId/image` | Reward image upload |
| GET/PUT | `/tenants/:id/qr/branding` | Enrollment QR branding |
| GET | `/tenants/:id/enrollment-qr` | Signed store QR token |
| GET | `/tenants/:id/enrollment-qr/render` | Branded QR SVG preview (`Accept: image/svg+xml`) |
| GET/PATCH | `/tenants/:id/settings` | Tenant profile + policies |
| GET/PUT | `/tenants/:id/settings/locales` | Supported locales |
| GET/POST/PATCH | `/tenants/:id/campaigns` | Campaign CRUD; `PATCH` with `status` for launch/pause |
| GET | `/tenants/:id/analytics/*` | Overview, member growth, tier distribution, heatmap, top rewards, retention |

Zod wire schemas: `packages/api-schemas/src/tenant-admin.ts`.

## Authenticated — staff or merchant admin

Group `/v1/staff`.

| Method | Path               | Description                                                         |
| ------ | ------------------ | ------------------------------------------------------------------- |
| POST   | `/staff/customers` | Create customer identity + enrollment + customer QR                 |
| POST   | `/staff/transactions` | Record purchase amount; awards points (rules engine; `store_id` on ledger) |
| POST   | `/staff/redemption-validations` | Burn claim QR (org-wide; no store gate on reward pickup) |

`POST /staff/transactions` requires permission `record_transaction` on the JWT (merchant admins implicitly have all store permissions).

## Authenticated — agent/staff portal (MFA, password, etc.)

| Method   | Path    | Description                    |
| -------- | ------- | ------------------------------ |
| GET/POST | `/me/*` | Profile, password, MFA factors |

## Frontend integration (merchant `/store`)

| Layer | Path | Notes |
| ----- | ---- | ----- |
| API client | `apps/web/src/lib/tenant-admin/` | `core.ts` + domain modules; barrel `index.ts` |
| Hooks | `apps/web/src/hooks/useTenantAdminQuery.ts`, `tenant-admin-hooks.ts` | Query key prefix `["tenant-admin", domain, tenantId, …]` |
| Metrics (dashboard) | `["tenant", …]` | `useTenantMetrics` — supports `from`/`to` via `toIsoRange` |
| Agent portal | `apps/web/src/lib/agentApi.ts` | Tenant-scoped reads (`/tenants/:id/metrics`, etc.) |

Page → endpoint map: customers → `GET …/customers`; transactions → `GET …/transactions`; agents → `GET …/agents` + `POST …/invitations`; points-rules → `…/rules`, `…/rule-simulations`, `…/tiers/:tierCode`; rewards → `…/rewards`; enrollment QR → `…/enrollment-qr`; campaigns → `…/campaigns`; analytics → `…/analytics/*`; settings → `…/settings`, `…/settings/locales`.

REST conventions: [`backend/docs/rest-conventions.md`](../backend/docs/rest-conventions.md).

## Rate limits

- `POST /v1/sessions`, `POST /v1/setup/superadmin`, `POST /v1/public/merchant-applications`, `GET /v1/public/tenant/:slug`, `POST /v1/public/phone-verifications`, `POST /v1/public/enrollments`, `GET /v1/customers/wallet`: per-IP sliding-window limits (`backend/interfaces/http/middleware/ratelimit.go`).

Optional: set `PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY=true` to require a verified phone token on public enrollment.

## Implementation map (planning docs vs code)

| Planning doc (example)     | Implemented as                                             |
| -------------------------- | ---------------------------------------------------------- |
| Merchant settings          | `GET/PATCH /v1/tenants/:id/settings`                       |
| Merchant customers         | `GET /v1/tenants/:id/customers`                            |
| `GET /tenant/qr`           | `GET /v1/tenants/:id/enrollment-qr` (merchant)             |
