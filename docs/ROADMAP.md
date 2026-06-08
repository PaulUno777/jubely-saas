# Jubelee MVP roadmap

Living tracker aligned with [context/NEW_PLANING.md](../context/NEW_PLANING.md), [Jubely Document de Cadrage](../context/Jubely%20Document%20de%20Cadrage%20Projet.md), and UX maquettes in [context/jubelee_design/](../context/jubelee_design/) (Customer / Staff / Admin HTML + [Jubelee_Architecture.png](../context/Jubelee_Architecture.png)).

**Legend:** ✅ Done · 🚧 In progress · 📋 Planned · ⏸ Out of MVP scope

**Validation docs:** [phase1-validation.md](./phase1-validation.md) · [phase3-validation.md](./phase3-validation.md) · [api.md](./api.md)

---

## Multi-store & billing (org model)

| Item | Status | Notes |
|------|--------|-------|
| `stores`, `store_memberships`, HQ backfill | ✅ | migrations `007`, `008` |
| Pooled loyalty + `reward_store_availability` pickup hints | ✅ | claim/validate org-wide |
| `plan_catalog`, `subscriptions`, MoMo `JBE-PAY-*` | ✅ | 30-day Growth trial on org create |
| Org freeze on lapse (`frozen`) | ✅ | middleware + enrollment gate |
| Merchant UI: boutiques, abonnement, store switcher | ✅ | `/store/stores`, `/store/subscription` |
| Stripe Checkout / webhooks | 📋 | `POST /v1/webhooks/stripe` stub; env in `.env.example` |

---

## Next up (current sprint)

| Priority | Item | Branch |
|----------|------|--------|
| 1 | Land HttpOnly auth BFF + `proxy.ts` + Phase 3 backend APIs | `feat/auth-bff-httpOnly` (PR open) |
| 2 | Agent purchase UI (`POST /v1/staff/purchases`) | `feat/phase3-agent-purchase` |
| 3 | Manual Phase 3 validation (enroll → purchase → metrics) | [phase3-validation.md](./phase3-validation.md) · `pnpm dev:seed` |
| ✅ | Staff invite accept page `/invite/[token]` | local |
| ✅ | Store customers / transactions list (read-only) | local |
| ✅ | Customer wallet (`GET /v1/customers/me/wallet`, `/v1/customers/wallet?customer_qr=`) | local |

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
| Fly.io / Vercel deploy | ✅ | `backend/Dockerfile`, `fly.toml`, `apps/web/vercel.json`, CI workflows, [deploy-production.md](./deploy-production.md) |

### Phase 1 manual checks

- [x] Superadmin login → `/root`
- [x] Create tenant + merchant admin
- [x] Merchant admin login → `/store`, no `/root` access
- [x] Sidebar stats + coming-soon placeholders

---

## Phase 2 — Merchant admin config (weeks 3–4)

| Item | Status | Notes |
|------|--------|-------|
| Merchant tenant API `/v1/tenants/:id/*` | ✅ | Primary for `/store` portal — see [api.md](./api.md) |
| `GET/PATCH …/settings`, locales, QR branding | ✅ | `/store/settings`, `/store/enrollment-qr` |
| Customers, transactions, agents | ✅ | Tenant list + detail + invitations |
| Rules, tiers, rewards, campaigns | ✅ | `/store/points-rules`, `/store/rewards`, `/store/campaigns` |
| Analytics rollups | ✅ | `/store/analytics` |
| `GET …/metrics` + `from`/`to` | ✅ | Dashboard uses `tenant-admin` client |
| Legacy `/v1/store/*` | 🚧 | Agent portal only (4 read endpoints) |
| `GET/POST /v1/invitations/:token` | ✅ | `/invite/[token]` |
| Custom roles UI | ⏸ | Permissions in JWT only |
| `GET /public/tenant/:slug` | ✅ | Join page |

### Phase 2 manual checks

- [x] Merchant admin: settings, branding, QR (tenant API)
- [x] Create staff invitation / list agents
- [x] Agent self-service activation (`/invite/[token]`)
- [ ] Custom role with subset permissions (deferred)
- [ ] Cross-tenant isolation manual test (second tenant)

---

## Phase 3 — Enrollment & transactions (weeks 5–6)

| Item | Status | Notes |
|------|--------|-------|
| `POST /public/otp/send` + `verify` | ✅ | In-memory OTP dev |
| `POST /v1/public/enrollments` | ✅ | `/join/[slug]` |
| `POST /staff/customers` | ✅ | `/agent/customers` |
| `POST /staff/purchases` (rule engine, default 1 pt / 100 FCFA) | ✅ | QR + phone |
| `POST /staff/redemptions/validate` | ✅ | `/agent/validate` |
| Agent purchase UI | ✅ | `/agent/purchase` |
| Customer wallet + rewards claim | ✅ | `/customer/wallet`, `/customer/rewards` |
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
| Rules table + Rule Engine | ✅ | `points_rules` + `POST /v1/store/rules/simulate` |
| Rewards CRUD + claim + agent validate | ✅ | Flows 3/5/8 |
| Rule builder UI (visual) | ⏸ | Form + simulator at `/store/points-rules` |
| Redis rule cache | ⏸ |
| Security headers + pilot deploy docs | ✅ | See [deploy-production.md](./deploy-production.md) |

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
| `POST /v1/public/enrollments` | ✅ | `/join/[slug]` |
| `POST /v1/auth/customer/login` + `session` | ✅ | Customer OTP login |
| `GET /v1/customers/me/wallet` | ✅ | `/customer/wallet` |
| `GET/POST /v1/customers/me/rewards` | ✅ | `/customer/rewards` |
| `POST /v1/staff/customers` | ✅ | `/agent/customers` |
| `POST /v1/staff/purchases` | ✅ | `/agent/purchase`, scanner |
| `POST /v1/staff/redemptions/validate` | ✅ | `/agent/validate` |
| `GET/POST /v1/store/rewards` | ✅ | `/store/rewards` |
| `GET/POST /v1/store/rules` + simulate | ✅ | `/store/points-rules` |
| `GET /v1/invitations/:token` | ✅ | `/invite/[token]` |
| `POST /v1/invitations/:token/accept` | ✅ | `/invite/[token]` |
| `GET /v1/store/customers` | ✅ | `/store/customers` |
| `GET /v1/store/transactions` | ✅ | `/store/transactions` |
| `GET /v1/customers/wallet?customer_qr=` | ✅ | Staff/customer QR lookup |

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
