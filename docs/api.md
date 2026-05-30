# Jubely HTTP API (`/v1`)

Base URL is configured per environment (e.g. `http://localhost:8082/v1`). Responses use JSON envelopes: success `{ "data": ..., "meta": ... }`, errors `{ "error": { "code", "message", "details?" }, "meta": ... }`.

**Web app (Next.js BFF):** the browser calls `http://localhost:3000/api/v1/...` (proxy to Go) and `http://localhost:3000/api/auth/*` (HttpOnly cookies). Staff/merchant JWTs are not stored in `localStorage`.

## Public (no auth)

| Method | Path                         | Description                                                                                      |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| POST   | `/public/store/signup`       | Self-serve store signup (tenant + first admin)                                                   |
| GET    | `/public/files/*filepath`    | Serve uploaded assets                                                                            |
| GET    | `/public/tenant/:slug`       | Public tenant card: name, slug, logo, `store_qr` token for enrollment                            |
| POST   | `/public/otp/send`           | Request SMS-style OTP (in-memory MVP; use `PUBLIC_OTP_LOG_CODE=true` on API to log codes in dev) |
| POST   | `/public/otp/verify`         | Verify OTP; returns `phone_verify_token` JWT for optional `phone_verify_token` on enroll         |
| POST   | `/public/enrollments`        | Enroll customer via signed `store_qr` + phone + name                                             |
| POST   | `/auth/login`                | Email + password; optional `tenant_slug` for tenant-scoped users                                 |
| POST   | `/auth/customer/login`       | Customer login after OTP verify (`phone_verify_token`)                                           |
| POST   | `/auth/refresh`              | Refresh access token                                                                             |
| POST   | `/auth/logout`               | Revoke refresh session                                                                           |
| POST   | `/auth/mfa/totp/verify`      | Complete MFA login                                                                               |
| POST   | `/bootstrap/superadmin`      | One-shot bootstrap (requires `X-Bootstrap-Secret`)                                               |
| GET    | `/invitations/:token`        | Invitation preview                                                                               |
| POST   | `/invitations/:token/accept` | Accept invitation                                                                                |

## Customers (loyalty member)

| Method | Path                         | Auth | Description |
| ------ | ---------------------------- | ---- | ----------- |
| GET    | `/customers/wallet`          | —    | Wallet by query `customer_qr` (MVP device-local QR access) |
| GET    | `/customers/me/wallet`       | Bearer (customer JWT, `active_enrollment_id` set) | Wallet for active enrollment |
| POST   | `/auth/customer/session`     | Bearer (customer JWT) | Set active enrollment in session (`enrollment_id`) |

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
| GET    | `/superadmin/tenants/:tenantId/store-qr`    | Signed store QR token                                          |
| GET    | `/superadmin/stats`                         | Dashboard stats                                                |
| POST   | `/superadmin/uploads/tenant-logo`           | Multipart tenant logo upload                                   |

## Authenticated — merchant admin (`tenant_id` claim, role `merchant_admin`)

Group `/v1/store`.

| Method | Path                 | Description                                                    |
| ------ | -------------------- | -------------------------------------------------------------- |
| GET    | `/store/tenant`      | Current tenant profile                                         |
| PATCH  | `/store/tenant`      | Update `name`, `conflict_policy`, `settings` (not plan/active) |
| GET    | `/store/metrics`     | Points distributed + point events this month                   |
| GET    | `/store/qr`          | Signed store QR (same semantics as superadmin route)           |
| GET    | `/store/users`        | List store users                                               |
| GET    | `/store/customers`    | Paginated enrolled customers + point balances                  |
| GET    | `/store/transactions` | Paginated point events (ledger) for the store                    |
| POST   | `/store/invitations`  | Invite staff / roles                                           |

## Authenticated — staff or merchant admin

Group `/v1/staff`.

| Method | Path               | Description                                                         |
| ------ | ------------------ | ------------------------------------------------------------------- |
| POST   | `/staff/customers` | Create customer identity + enrollment + customer QR                 |
| POST   | `/staff/purchases` | Record purchase amount; awards points (MVP rule: 1 pt per 500 FCFA) |

`POST /staff/purchases` requires permission `record_transaction` on the JWT (merchant admins implicitly have all store permissions).

## Authenticated — agent/staff portal (MFA, password, etc.)

| Method   | Path    | Description                    |
| -------- | ------- | ------------------------------ |
| GET/POST | `/me/*` | Profile, password, MFA factors |

## Rate limits

- `POST /v1/auth/login`, `POST /v1/bootstrap/superadmin`, `POST /v1/public/store/signup`, `GET /v1/public/tenant/:slug`, `POST /v1/public/otp/send`, `POST /v1/public/otp/verify`, `POST /v1/public/enrollments`, `GET /v1/customers/wallet`: per-IP sliding-window limits (`backend/interfaces/httpserver/ratelimit.go`).

Optional: set `PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY=true` to require a verified phone token on public enrollment.

## Implementation map (planning docs vs code)

| Planning doc (example)     | Implemented as                                             |
| -------------------------- | ---------------------------------------------------------- |
| `GET /tenant/me`           | `GET /v1/store/tenant`                                     |
| `PATCH /tenant/me`         | `PATCH /v1/store/tenant`                                   |
| `GET /public/tenant/:slug` | `GET /v1/public/tenant/:slug`                              |
| `GET /tenant/qr`           | `GET /v1/store/qr` (merchant) or superadmin `.../store-qr` |
