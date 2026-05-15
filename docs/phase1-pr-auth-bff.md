# Pull request: `feat/auth-bff-httpOnly-pr1` → `develop`

## Title

```
feat(web,api): HttpOnly session cookies, BFF auth proxy, Phase 3 enrollment APIs
```

## Summary

- HttpOnly `jubely_session` / `jubely_refresh` cookies set by Next.js BFF (`/api/auth/*`).
- Same-origin `/api/v1/*` proxy adds `Authorization` from the session cookie.
- `middleware.ts` replaced with [`apps/web/src/proxy.ts`](../apps/web/src/proxy.ts) (Next.js 16 proxy convention).
- Phase 3 backend: public OTP, PWA enroll scan, staff purchases, point events, rate limits.
- Tracking: [ROADMAP.md](./ROADMAP.md), [api.md](./api.md), [phase3-validation.md](./phase3-validation.md).

## Test plan

- [ ] `cd backend && go test ./...`
- [ ] `pnpm --dir apps/web exec tsc --noEmit && pnpm --dir apps/web lint`
- [ ] Login → refresh → logout (cookies, no token in `localStorage`)
- [ ] [phase1-validation.md](./phase1-validation.md) superadmin + merchant flows

## Follow-up PR

Agent purchase UI: `feat/phase3-agent-purchase` (stacked on this branch).
