# Jubely (monorepo)

[![Backend CI](https://github.com/PaulUno777/jubely-saas/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/PaulUno777/jubely-saas/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/PaulUno777/jubely-saas/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/PaulUno777/jubely-saas/actions/workflows/frontend-ci.yml)

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

## CI/CD

| Workflow | File | Trigger |
| -------- | ---- | ------- |
| Backend CI | `.github/workflows/backend-ci.yml` | PR / push (`backend/**`) |
| Frontend CI | `.github/workflows/frontend-ci.yml` | PR / push (`apps/**`, `packages/**`) |
| Deploy API | `.github/workflows/deploy-api.yml` | Push to `main` (`backend/**`) |
| Deploy Web | `.github/workflows/deploy-web.yml` | Push to `main` (`apps/web/**`, `packages/**`) |

[View all workflow runs](https://github.com/PaulUno777/jubely-saas/actions)
