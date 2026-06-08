# API route inventory

Normalized routes registered in `interfaces/httpserver/router.go` (phases 5–9 complete).

## Infrastructure

| Method | Path |
|--------|------|
| GET | `/health` |

## Public (`/v1/public`)

| Method | Path |
|--------|------|
| GET | `/v1/public/tenant/:slug` |
| POST | `/v1/public/phone-verifications` |
| POST | `/v1/public/phone-verifications/:id/confirmations` |
| POST | `/v1/public/enrollments` |
| GET | `/v1/public/plans` |
| POST | `/v1/public/merchant-applications` |
| GET | `/v1/public/locations/nearby` |
| GET | `/v1/public/files/*filepath` |

## Webhooks

| Method | Path |
|--------|------|
| POST | `/v1/webhooks/stripe` |

## Setup & sessions

| Method | Path |
|--------|------|
| POST | `/v1/setup/superadmin` |
| POST | `/v1/sessions` |
| POST | `/v1/sessions/refresh` |
| DELETE | `/v1/sessions/current` |
| PUT | `/v1/sessions/current/workspace` |
| POST | `/v1/sessions/mfa/totp/verifications` |
| POST | `/v1/sessions/mfa/passkey/challenges` |
| POST | `/v1/sessions/mfa/passkey/responses` |
| POST | `/v1/customer-sessions` |
| PUT | `/v1/customer-sessions/current` |

## Invitations

| Method | Path |
|--------|------|
| GET | `/v1/invitations/:token` |
| PATCH | `/v1/invitations/:token` |

## Superadmin (`/v1/superadmin`)

| Method | Path |
|--------|------|
| GET | `/v1/superadmin/tenants` |
| POST | `/v1/superadmin/tenants` |
| GET | `/v1/superadmin/tenants/:tenantId` |
| PATCH | `/v1/superadmin/tenants/:tenantId` |
| GET | `/v1/superadmin/tenants/:tenantId/users` |
| POST | `/v1/superadmin/tenants/:tenantId/users` |
| POST | `/v1/superadmin/tenants/:tenantId/invitations` |
| GET | `/v1/superadmin/tenants/:tenantId/enrollment-qr` |
| GET | `/v1/superadmin/stats` |
| POST | `/v1/superadmin/uploads/tenant-logo` |

## Customers (`/v1/customers`)

| Method | Path |
|--------|------|
| GET | `/v1/customers/wallet` |
| GET | `/v1/customers/me/wallet` |
| PATCH | `/v1/customers/me/profile` |
| GET | `/v1/customers/me/rewards` |
| POST | `/v1/customers/me/reward-claims` |

## Tenant admin (`/v1/tenants/:tenantId`)

Merchant admin uses **only** this surface (DRY — no `/organizations/me`).

| Method | Path |
|--------|------|
| GET | `/v1/tenants/:tenantId/metrics` |
| GET | `/v1/tenants/:tenantId/metrics/loyalty-activity` |
| GET | `/v1/tenants/:tenantId/stats` |
| GET | `/v1/tenants/:tenantId/locations` |
| POST | `/v1/tenants/:tenantId/locations` |
| PATCH | `/v1/tenants/:tenantId/locations/:locationId` |
| GET | `/v1/tenants/:tenantId/customers` |
| GET | `/v1/tenants/:tenantId/customers/:enrollmentId` |
| POST | `/v1/tenants/:tenantId/customers/:enrollmentId/adjustments` |
| GET | `/v1/tenants/:tenantId/transactions` |
| GET | `/v1/tenants/:tenantId/agents` |
| GET | `/v1/tenants/:tenantId/rules` |
| POST | `/v1/tenants/:tenantId/rules` |
| PATCH | `/v1/tenants/:tenantId/rules/:ruleId` |
| POST | `/v1/tenants/:tenantId/rule-simulations` |
| POST | `/v1/tenants/:tenantId/rule-validations` |
| GET | `/v1/tenants/:tenantId/tiers` |
| PUT | `/v1/tenants/:tenantId/tiers/:tierCode` |
| GET | `/v1/tenants/:tenantId/rewards` |
| POST | `/v1/tenants/:tenantId/rewards` |
| PATCH | `/v1/tenants/:tenantId/rewards/:rewardId` |
| PUT | `/v1/tenants/:tenantId/rewards/:rewardId/image` |
| GET | `/v1/tenants/:tenantId/qr/branding` |
| PUT | `/v1/tenants/:tenantId/qr/branding` |
| GET | `/v1/tenants/:tenantId/enrollment-qr` |
| GET | `/v1/tenants/:tenantId/enrollment-qr/render` |
| GET | `/v1/tenants/:tenantId/settings` |
| PATCH | `/v1/tenants/:tenantId/settings` |
| GET | `/v1/tenants/:tenantId/settings/locales` |
| PUT | `/v1/tenants/:tenantId/settings/locales` |
| POST | `/v1/tenants/:tenantId/invitations` |
| GET | `/v1/tenants/:tenantId/campaigns` |
| POST | `/v1/tenants/:tenantId/campaigns` |
| GET | `/v1/tenants/:tenantId/campaigns/:campaignId` |
| PATCH | `/v1/tenants/:tenantId/campaigns/:campaignId` |
| GET | `/v1/tenants/:tenantId/subscription` |
| POST | `/v1/tenants/:tenantId/subscription/invoices` |
| POST | `/v1/tenants/:tenantId/subscription/invoices/:invoiceId/confirmations` |
| GET | `/v1/tenants/:tenantId/analytics/overview` |
| GET | `/v1/tenants/:tenantId/analytics/member-growth` |
| GET | `/v1/tenants/:tenantId/analytics/tier-distribution` |
| GET | `/v1/tenants/:tenantId/analytics/hourly-heatmap` |
| GET | `/v1/tenants/:tenantId/analytics/top-rewards` |
| GET | `/v1/tenants/:tenantId/analytics/retention-cohorts` |

## Staff (`/v1/staff`)

| Method | Path |
|--------|------|
| POST | `/v1/staff/customers` |
| POST | `/v1/staff/transactions` |
| POST | `/v1/staff/redemption-validations` |

## Current user (`/v1/me`)

| Method | Path |
|--------|------|
| PATCH | `/v1/me/credentials/password` |
| GET | `/v1/me/mfa` |
| POST | `/v1/me/mfa/totp/setup` |
| POST | `/v1/me/mfa/totp/confirm` |
| DELETE | `/v1/me/mfa/factors/:id` |
| POST | `/v1/me/mfa/passkey/register/begin` |
| POST | `/v1/me/mfa/passkey/register/finish` |

**Total:** 92 routes (1 health + 91 under `/v1`).

## Removed legacy routes (phases 5–9)

| Old | New |
|-----|-----|
| `GET /v1/store/metrics` | `GET /v1/tenants/:tenantId/metrics` |
| `GET /v1/store/tenant` | `GET /v1/tenants/:tenantId/settings` |
| `GET /v1/store/customers` | `GET /v1/tenants/:tenantId/customers` |
| `GET /v1/store/transactions` | `GET /v1/tenants/:tenantId/transactions` |
| `POST /v1/auth/login` | `POST /v1/sessions` |
| `POST /v1/auth/logout` | `DELETE /v1/sessions/current` |
| `POST /v1/auth/refresh` | `POST /v1/sessions/refresh` |
| `POST /v1/auth/workspace` | `PUT /v1/sessions/current/workspace` |
| `POST /v1/auth/customer/login` | `POST /v1/customer-sessions` |
| `POST /v1/auth/customer/session` | `PUT /v1/customer-sessions/current` |
| `POST /v1/bootstrap/superadmin` | `POST /v1/setup/superadmin` |
| `POST /v1/auth/mfa/totp/verify` | `POST /v1/sessions/mfa/totp/verifications` |
| `POST /v1/auth/mfa/passkey/begin` | `POST /v1/sessions/mfa/passkey/challenges` |
| `POST /v1/auth/mfa/passkey/finish` | `POST /v1/sessions/mfa/passkey/responses` |
| `POST /v1/public/otp/send` | `POST /v1/public/phone-verifications` |
| `POST /v1/public/otp/verify` | `POST /v1/public/phone-verifications/:id/confirmations` |
| `POST /v1/public/store/signup` | `POST /v1/public/merchant-applications` |
| `POST /v1/invitations/:token/accept` | `PATCH /v1/invitations/:token` `{status: accepted}` |
| `POST …/campaigns/:id/launch` | `PATCH …/campaigns/:id` `{status: active}` |
| `POST …/campaigns/:id/pause` | `PATCH …/campaigns/:id` `{status: paused}` |
| `POST …/rules/simulate` | `POST …/rule-simulations` |
| `POST …/rules/validate` | `POST …/rule-validations` |
| `GET …/qr/token` | `GET …/enrollment-qr` |
| `GET …/qr/render.svg` | `GET …/enrollment-qr/render` |
| `PUT /v1/tenants/:tenantId/tiers` | `PUT /v1/tenants/:tenantId/tiers/:tierCode` |
| `POST …/rewards/:id/image` | `PUT …/rewards/:id/image` |
| `GET /v1/superadmin/tenants/:id/store-qr` | `GET /v1/superadmin/tenants/:id/enrollment-qr` |
| `POST /v1/staff/purchases` | `POST /v1/staff/transactions` |
| `POST /v1/staff/redemptions/validate` | `POST /v1/staff/redemption-validations` |
| `POST …/subscription/momo-invoice` | `POST …/subscription/invoices` |
| `POST …/subscription/confirm-momo` | `POST …/subscription/invoices/:invoiceId/confirmations` |
| `POST /v1/me/password` | `PATCH /v1/me/credentials/password` |
| `POST /v1/customers/me/rewards/:rewardId/claims` | `POST /v1/customers/me/reward-claims` `{reward_id}` |
| `GET /v1/organizations/me/stores` | `GET /v1/tenants/:tenantId/locations` |
| `POST /v1/organizations/me/stores` | `POST /v1/tenants/:tenantId/locations` |
| `GET /v1/organizations/me/subscription` | `GET /v1/tenants/:tenantId/subscription` |
| `POST /v1/organizations/me/subscription/invoices` | `POST /v1/tenants/:tenantId/subscription/invoices` |
| `POST /v1/organizations/me/subscription/invoices/:invoiceId/confirmations` | `POST /v1/tenants/:tenantId/subscription/invoices/:invoiceId/confirmations` |
