# Jubely MVP roadmap

Living tracker aligned with [context/NEW_PLANING.md](../context/NEW_PLANING.md) and [Jubely Document de Cadrage](../context/Jubely%20Document%20de%20Cadrage%20Projet.md).

**Legend:** ✅ Done · 🚧 In progress · 📋 Planned · ⏸ Out of MVP scope

**Validation docs:** [phase1-validation.md](./phase1-validation.md) · [phase3-validation.md](./phase3-validation.md) · [api.md](./api.md)

---

## Next up (current sprint)

| Priority | Item | Branch |
|----------|------|--------|
| 1 | Land HttpOnly auth BFF + `proxy.ts` + Phase 3 backend APIs | `feat/auth-bff-httpOnly` (PR open) |
| 2 | Agent purchase UI (`POST /v1/staff/purchases`) | `feat/phase3-agent-purchase` |
| 3 | Manual Phase 3 validation (enroll → purchase → metrics) | [phase3-validation.md](./phase3-validation.md) · `pnpm dev:seed` |
| ✅ | Staff invite accept page `/invite/[token]` | local |
| ✅ | Store customers / transactions list (read-only) | local |
| ✅ | Customer wallet balance + history (`GET /v1/pwa/wallet?customer_qr=`) | local |

---

## Phase 1 — Infrastructure & SuperAdmin (weeks 1–2)

| Item | Status | Notes |
|------|--------|-------|
| Go API, Postgres, migrations | ✅ | `backend/cmd/api` |
| JWT access + refresh | ✅ | HttpOnly cookies via Next BFF |
| RBAC middleware | ✅ | Role + `perms` on JWT |
| Superadmin bootstrap | ✅ | `POST /v1/bootstrap/superadmin` |
| Tenant CRUD + merchant users | ✅ | `/v1/superadmin/tenants` |
| Web login + role routing | ✅ | `/login`, `proxy.ts` |
| Superadmin UI (tenants, wizard, detail) | ✅ | `/root/*` |
| CI lint/test | 🚧 | `pnpm test:backend` · `pnpm test:web` |
| Fly.io / Vercel deploy | 📋 | |

### Phase 1 manual checks

- [x] Superadmin login → `/root`
- [x] Create tenant + merchant admin
- [x] Merchant admin login → `/store`, no `/root` access
- [x] Sidebar stats + coming-soon placeholders

---

## Phase 2 — Merchant admin config (weeks 3–4)

| Item | Status | Notes |
|------|--------|-------|
| `GET/PATCH /v1/store/tenant` | ✅ | Settings + branding |
| `GET /v1/store/qr` | ✅ | Enrollment QR page |
| `GET /v1/store/users` + invitations | ✅ | Agents page |
| `GET/POST /v1/invitations/:token` | ✅ | `/invite/[token]` |
| `GET /v1/store/metrics` | ✅ | Dashboard KPIs |
| `GET /v1/store/customers` | ✅ | `/store/customers` |
| `GET /v1/store/transactions` | ✅ | `/store/transactions` (point events) |
| Store customers list UI | ✅ | `/store/customers` |
| Store transactions list UI | ✅ | `/store/transactions` |
| Rewards / rules CRUD | ⏸ | Phase 4 |
| Custom roles UI | ⏸ | Permissions in JWT only |
| `GET /public/tenant/:slug` | ✅ | Join page |

### Phase 2 manual checks

- [x] Merchant admin: settings, branding, QR
- [x] Create staff invitation / list users
- [x] Agent self-service activation (`/invite/[token]`)
- [ ] Custom role with subset permissions (deferred)
- [ ] Cross-tenant isolation manual test (second tenant)

---

## Phase 3 — Enrollment & transactions (weeks 5–6)

| Item | Status | Notes |
|------|--------|-------|
| `POST /public/otp/send` + `verify` | ✅ | In-memory OTP dev |
| `POST /pwa/enrollments/scan` | ✅ | `/join/[slug]` |
| `POST /staff/customers` | ✅ | `/agent/customers` |
| `POST /staff/purchases` (1 pt / 500 FCFA) | ✅ | Backend |
| Agent purchase UI | ✅ | `/agent/purchase` |
| Customer wallet (balance/history) | ✅ | `/customer/wallet` + `GET /v1/pwa/wallet` |
| Idempotency on purchases | 📋 | Optional MVP |
| Offline agent queue | ⏸ | Post-MVP |

### Phase 3 manual checks

See [phase3-validation.md](./phase3-validation.md).

- [ ] Join via QR / `/join/:slug` + OTP (manual — see [phase3-validation.md](./phase3-validation.md))
- [ ] Agent creates customer (manual)
- [x] Agent purchase UI → `POST /v1/staff/purchases` (automated: `tsc`, `lint`, `go test`)
- [ ] Store metrics increment after purchase (manual)

---

## Phase 4 — Rule engine & rewards (weeks 7–8)

| Item | Status |
|------|--------|
| Rules table + Rule Engine | ⏸ |
| Rewards CRUD + claim + agent validate | ⏸ |
| Rule builder UI | ⏸ |
| Redis rule cache | ⏸ |
| Security audit / pilot launch | ⏸ |

---

## API ↔ UI matrix

| Endpoint | Backend | Web route / page |
|----------|---------|------------------|
| `POST /v1/auth/login` | ✅ | BFF `/api/auth/login` → `/login` |
| `POST /v1/auth/refresh` | ✅ | BFF `/api/auth/refresh` |
| `GET /v1/superadmin/tenants` | ✅ | `/root/tenants` |
| `GET /v1/store/tenant` | ✅ | `/store/settings`, branding |
| `GET /v1/store/metrics` | ✅ | `/store` dashboard |
| `GET /v1/public/tenant/:slug` | ✅ | `/join/[slug]` |
| `POST /v1/pwa/enrollments/scan` | ✅ | `/join/[slug]` |
| `POST /v1/staff/customers` | ✅ | `/agent/customers` |
| `POST /v1/staff/purchases` | ✅ | `/agent/purchase` |
| `GET /v1/invitations/:token` | ✅ | `/invite/[token]` |
| `POST /v1/invitations/:token/accept` | ✅ | `/invite/[token]` |
| `GET /v1/store/customers` | ✅ | `/store/customers` |
| `GET /v1/store/transactions` | ✅ | `/store/transactions` |
| `GET /v1/pwa/wallet` | ✅ | `/customer/wallet` (customer QR auth) |

---

## Web environment (BFF auth)

| Variable | Purpose |
|----------|---------|
| `API_INTERNAL_BASE_URL` | Server-side upstream Go API (e.g. `http://localhost:8082`) |
| `NEXT_PUBLIC_API_BASE_URL` | Go API origin only (e.g. `http://localhost:8082`, **not** `.../api`) |
| `AUTH_COOKIE_DOMAIN` | Optional cookie domain |
| `AUTH_COOKIE_SAME_SITE` | `lax` (default), `strict`, or `none` |
| `COOKIE_SECURE` | `true` / `false`; defaults to secure in production |
| `PUBLIC_OTP_LOG_CODE` | API: log OTP in dev |

---

## Branch tracker

| Branch | Status | Merges to |
|--------|--------|-----------|
| `feat/auth-bff-httpOnly` | 🚧 | `develop` |
| `feat/phase3-agent-purchase` | 🚧 | `develop` (stacked on auth) |
| `feat/i18n-portal-pages` | ✅ (superseded by auth branch) | `develop` |
