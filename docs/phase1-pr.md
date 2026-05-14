# Pull request: `feat/i18n-portal-pages` → `develop`

Use this as the PR title/description when opening the merge request.

## Title

```
feat(web): Phase 1 portals — i18n, superadmin/store shells, store metrics, CI
```

## Description (template)

```markdown
## Summary
- Superadmin (`/root`) and merchant store (`/store`) shells, next-intl (en/fr), tenant logo upload copy, and dashboard/nav polish.
- Frontend CI: single pnpm version via `packageManager` in root `package.json`.
- Store loyalty metrics: `GET /v1/store/metrics` (points issued, point events this month) wired to sidebar footer and dashboard KPIs where applicable.
- Superadmin sidebar badges use live `GET /v1/superadmin/stats`; placeholder modules use dedicated `/root/*` routes.

## Environment
- Web: set `NEXT_PUBLIC_API_BASE_URL` (or app-specific `API_BASE_URL`) to the API origin, e.g. `http://localhost:8082` when using Docker-mapped compose.
- Do **not** commit uploaded assets or `.env.local` secrets.

## How to test
1. API: `go test ./...` in `backend/`.
2. Web: `pnpm lint:web` and `pnpm build:web` from repo root.
3. Manual Phase 1 path: see [docs/phase1-validation.md](./phase1-validation.md).
```

GitHub does not auto-open PRs from this file; open **Compare & pull request** from the pushed branch when ready.
