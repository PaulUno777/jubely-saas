# Jubely (monorepo)

This repository contains the **Go API** (`backend/`) and the first **web apps** (`apps/*`) managed with **pnpm workspaces**.

## Prereqs

- Node 24+ (see `.github/workflows/frontend-ci.yml`)
- pnpm 10+ (see `package.json` `packageManager`)
- Go **latest stable** (see `backend/go.mod` and `backend/README.md`)

## Local dev (web)

Install deps at the repo root:

```bash
pnpm install
```

Run:

```bash
pnpm dev:client
pnpm dev:agent
```

## Local dev (API + Postgres)

See `docker-compose.yml` and `backend/README.md`.

## CI

- Backend: `.github/workflows/backend-ci.yml`
- Web: `.github/workflows/frontend-ci.yml`
