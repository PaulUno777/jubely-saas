# REST API conventions

All JSON routes live under `/v1/`. Responses use the standard envelope (`data` + `meta`; errors in `error`). See [`api-routes.md`](api-routes.md) for the full route inventory and legacy mapping.

## Resources and paths

- **Collections use plural nouns**: `/tenants/:tenantId/customers`, `/campaigns`, `/rewards`.
- **Tenant scope**: merchant and agent APIs are under `/v1/tenants/:tenantId/*`. The JWT `tenant_id` must match `:tenantId`.
- **No duplicate surfaces**: legacy `/v1/store/*` and `/v1/organizations/me/*` were removed; merchant admin uses `/v1/tenants/:tenantId/*` only.
- **UI route prefixes** (`/store/*`, `/agent/*`) are portal shells only—they are not API resource names.

## HTTP verbs

| Verb | Use |
|------|-----|
| `GET` | Read one resource or list a collection |
| `POST` | Create a resource, or a **non-idempotent action** on a sub-resource collection (see below) |
| `PUT` | Full replace or upsert of a known resource (e.g. `PUT /tiers/:tierCode`, `PUT /rewards/:id/image`) |
| `PATCH` | Partial update, especially **state transitions** (`status`, `enabled`, invitation `status: accepted`) |
| `DELETE` | Remove a resource (e.g. `DELETE /v1/sessions/current` for logout) |

Prefer **PATCH on the resource** for state changes instead of verb suffixes:

- `PATCH /campaigns/:id` with `{ "status": "active" }` — not `POST .../launch`
- `PATCH /invitations/:token` with `{ "status": "accepted", "password": "..." }` — not `POST .../accept`

## Sub-resource collections (operations)

When an endpoint is not CRUD on a persistent entity, model it as a **sub-resource collection**:

| Operation | Path |
|-----------|------|
| Rule simulation | `POST /tenants/:tenantId/rule-simulations` |
| Rule validation | `POST /tenants/:tenantId/rule-validations` |
| Phone OTP send | `POST /v1/public/phone-verifications` |
| Phone OTP confirm | `POST /v1/public/phone-verifications/:id/confirmations` |
| Staff redemption check | `POST /v1/staff/redemption-validations` |
| Reward claim | `POST /v1/customers/me/reward-claims` with `{ "reward_id": "..." }` |
| MoMo subscription | `GET /tenants/:tenantId/subscription` |
| MoMo invoice create | `POST /tenants/:tenantId/subscription/invoices` |
| MoMo invoice confirm | `POST /tenants/:tenantId/subscription/invoices/:invoiceId/confirmations` |

## Auth and sessions

| Concern | Path |
|---------|------|
| Staff login | `POST /v1/sessions` |
| Logout | `DELETE /v1/sessions/current` |
| Refresh | `POST /v1/sessions/refresh` |
| Workspace select | `PUT /v1/sessions/current/workspace` |
| Customer login | `POST /v1/customer-sessions` |
| Customer enrollment select | `PUT /v1/customer-sessions/current` |
| MFA (multi-step) | `POST /v1/sessions/mfa/totp/verifications`, `POST /v1/sessions/mfa/passkey/challenges`, `POST /v1/sessions/mfa/passkey/responses` |
| One-time setup | `POST /v1/setup/superadmin` |

Multi-step ceremonies (WebAuthn, TOTP) use `begin`/`finish` or `challenges`/`responses` sub-paths under the session resource—acceptable for non-CRUD flows.

## Files and content negotiation

- **Image upload**: `PUT /tenants/:tenantId/rewards/:id/image` (`multipart/form-data`).
- **Enrollment QR SVG**: `GET /tenants/:tenantId/enrollment-qr/render` with `Accept: image/svg+xml`.
- **Enrollment QR token**: `GET /tenants/:tenantId/enrollment-qr` (JSON `store_qr` field retained for compatibility).

## Webhooks

External provider callbacks stay verb-oriented on a dedicated path: `POST /webhooks/stripe`.

## Adding new routes

1. Register in `interfaces/httpserver/router_*.go` (grouped by API surface).
2. Handler in the appropriate `handlers_*.go` file (or `handlers_tenantadmin_*.go` for merchant admin).
3. Handler calls **use cases only**—no direct `ports.*` repository access from handlers.
4. JSON mapping in `interfaces/http/presenter/` when non-trivial.
5. Update [`api-routes.md`](api-routes.md) and add a smoke assertion in `router_test.go` for critical paths.
6. Update `packages/api-schemas` and `apps/web` clients in the same change when the route is user-facing.
