---
description: First-time dev environment setup and compose startup
---

# Workflow: Dev Environment Setup

## Prerequisites

- Docker + Docker Compose installed
- Node.js 20+ installed
- pnpm installed globally (`npm install -g pnpm`)

## Step 1 — Install Dependencies

```bash
pnpm install
```

## Step 2 — Create Local Environment File

```bash
cp .env.example .env
```

Edit `.env` and fill in the required secrets:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Postgres password (required, no default) |
| `DATABASE_URL` | Full Prisma connection string (update password to match) |
| `DATABASE_URL_TEST` | Connection string for the test database |
| `JWT_SECRET` | Secret for signing JWT tokens |

The remaining variables have safe defaults for local development.

## Step 3 — Ensure Bind-Mount Targets Exist

```bash
mkdir -p repos keys
touch keys/authorized_keys
```

## Step 4 — Start All Services

```bash
docker compose up -d --build
```

Wait for all services to become healthy:

```bash
docker compose ps
```

Expected state: all 5 services (`caddy`, `backend`, `frontend`, `git-server`, `postgres`) show `healthy` or `running`.

## Step 5 — Apply Database Migrations and Seed

```bash
docker compose exec backend pnpm db:migrate
docker compose exec backend pnpm db:seed
```

The seed creates a dev user:
- Username: `devuser`
- Email: `dev@example.com`
- Password: `devpassword`

(configurable via `.env`)

## Step 6 — Verify Access Points

| Endpoint | URL |
|---|---|
| Web UI | `https://localhost` |
| API health | `https://localhost/api/internal/health` |
| Git HTTPS | `https://localhost/<owner>/<repo>.git` |
| Git SSH | `ssh://git@localhost:2222/<owner>/<repo>.git` |

> Caddy uses a self-signed certificate. Accept the browser warning or trust `caddy-root.crt`.

## Local Hot-Reload Development

To develop with hot reload (run services locally, keep infra in Docker):

```bash
# Keep Postgres + Caddy + git-server in Docker, stop backend
docker compose stop backend
pnpm --filter @custom-git-server/backend dev
# Backend listens on http://localhost:4000

# In another terminal, stop frontend container
docker compose stop frontend
pnpm --filter @custom-git-server/frontend dev
# Frontend listens on http://localhost:5173
```

## Reset Everything

Stop containers and destroy volumes (full reset):

```bash
docker compose down -v
```

After a full reset, repeat Steps 4 and 5.
