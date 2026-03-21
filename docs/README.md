# Custom Git Server — Fullstack Monorepo Guide

This repository contains the fullstack Git hosting platform:

- `git-server` for SSH + Git Smart HTTP transport
- `backend` API (`Fastify` + `Prisma` + `Postgres`)
- `frontend` SPA (`Vite` + `React` + `TypeScript`)
- `caddy` edge proxy with TLS and routing

## Current Architecture

```text
Browser/API client
    -> Caddy (:443)
         -> /app*        -> frontend:3000
         -> /api/*       -> backend:4000
         -> (git paths)  -> git-server:80

Git SSH client
    -> git-server:22 (host port 2222)
```

## Repository Layout

```text
.
├── apps/
│   ├── backend/        # Fastify API + Prisma
│   └── frontend/       # React SPA + tests
├── infra/git-server/   # nginx + sshd + fcgiwrap + git-http-backend
├── docs/               # design and task tracking docs
├── keys/               # bind-mounted authorized_keys (gitignored)
├── repos/              # bind-mounted bare repos (gitignored)
├── Caddyfile
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Prerequisites

- Docker + Docker Compose
- Node.js 20+
- pnpm

## Setup

Install workspace dependencies from repo root:

```bash
pnpm install
```

Create local env file if missing:

```bash
cp .env.example .env
```

## Start / Stop the System

Start all services:

```bash
docker compose up -d --build
```

Stop all services (keep data):

```bash
docker compose down
```

Stop and remove data volumes (destructive):

```bash
docker compose down -v
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f
```

## Access Points

- Frontend UI: `https://localhost/app`
- API (via Caddy): `https://localhost/api/*`
- Git over HTTPS: `https://localhost/<owner>/<repo>.git`
- Git over SSH: `ssh://git@localhost:2222/<owner>/<repo>.git`

If local CA trust is not configured yet, browser/curl warnings are expected.

## Testing

### Backend

Run backend tests:

```bash
pnpm --filter @custom-git-server/backend test
```

Run backend typecheck:

```bash
pnpm --filter @custom-git-server/backend typecheck
```

### Frontend

Run frontend unit tests:

```bash
pnpm --filter @custom-git-server/frontend test
```

Run frontend coverage:

```bash
pnpm --filter @custom-git-server/frontend test:cov
```

Run frontend e2e tests:

```bash
pnpm --filter @custom-git-server/frontend test:e2e
```

### Whole workspace (Turborepo)

```bash
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Important Notes

- Internal backend routes under `/internal/*` are service-internal only.
- Do not store secrets in code; keep values in `.env`.
- Use `docs/tasks-fullstack.md` as the implementation progress checklist.

## Related Documentation

- [design-fullstack.md](design-fullstack.md)
- [tasks-fullstack.md](tasks-fullstack.md)
- [design-http-auth-https.md](design-http-auth-https.md)
- [tasks-http-auth-https.md](tasks-http-auth-https.md)
