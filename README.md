# Custom Git Server Monorepo

Self-hosted Git hosting platform monorepo with:

- Git transport layer (`git-server`: SSH + Smart HTTP)
- API backend (`Fastify` + `Prisma` + `Postgres`)
- Web frontend (`Vite` + `React` + `TypeScript`)
- Edge routing/TLS via `Caddy`

This repository is managed as a `pnpm` workspace with Turborepo.

## Monorepo Structure

```text
.
├── apps/
│   ├── backend/          # Fastify API + Prisma
│   └── frontend/         # React SPA (Vite)
├── infra/
│   └── git-server/       # nginx + sshd + fcgiwrap + git-http-backend
├── docs/                 # design docs, task plans, technical notes
├── keys/                 # bind-mounted authorized_keys (gitignored)
├── repos/                # bind-mounted bare git repos (gitignored)
├── Caddyfile
├── docker-compose.yml
├── package.json          # workspace root scripts
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Developer Workflow

### Prerequisites

- `Docker` + `Docker Compose`
- `Node.js 20+`
- `pnpm` (workspace package manager)

---

### 1. First-Time Setup

**Clone and install dependencies:**

```bash
git clone <repo-url>
cd custom-git-server
pnpm install
```

**Create your local environment file:**

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholder secrets:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Postgres password (required, no default) |
| `DATABASE_URL` | Full Prisma connection string (update password to match) |
| `DATABASE_URL_TEST` | Connection string for the test database |
| `JWT_SECRET` | Secret for signing JWT tokens |

The remaining variables have safe defaults for local development; see `.env.example` for all options.

**Ensure bind-mount targets exist:**

```bash
mkdir -p repos keys
touch keys/authorized_keys
```

---

### 2. Start All Services

Build images and start all containers in the background:

```bash
docker compose up -d --build
```

Services started:

| Service | Purpose | Exposed |
|---|---|---|
| `caddy` | TLS termination + routing | `80`, `443` |
| `backend` | Fastify API | internal via Caddy `/api/*` |
| `frontend` | React SPA | internal via Caddy `/*` |
| `git-server` | SSH + Git Smart HTTP | SSH on `2222` |
| `postgres` | Database | `127.0.0.1:5432` |

Wait for all services to become healthy:

```bash
docker compose ps
```

All services should show `healthy` or `running`. The `backend` depends on `postgres` being healthy before it starts.

---

### 3. Database Setup (first boot or after schema change)

Run pending migrations and the dev seed inside the running backend container:

```bash
# If you pulled backend changes (e.g. Prisma config updates), rebuild backend first
docker compose up -d --build backend

# Apply all pending migrations
docker compose exec backend pnpm db:migrate

# Seed the database with a dev user
docker compose exec backend pnpm db:seed
```

The seed creates a test user with credentials defined in `.env`:

```
SEED_USER_USERNAME=devuser
SEED_USER_EMAIL=dev@example.com
SEED_USER_PASSWORD=devpassword
```

**Creating a new migration during development** (requires a local Postgres connection on `localhost:5432`):

```bash
pnpm --filter @custom-git-server/backend db:migrate:dev -- --name <migration-name>
```

This generates a new SQL migration in `apps/backend/prisma/migrations/` and regenerates the Prisma client.

---

### 4. Local Development (hot reload)

For active backend or frontend development, run the service outside of Docker with hot reload while keeping the rest of the stack (Postgres, Caddy, git-server) running in Docker.

**Backend** — `tsx watch` restarts on every file change:

```bash
# Keep Postgres running in Docker, stop the backend container
docker compose stop backend

# Run backend locally (reads .env automatically)
pnpm --filter @custom-git-server/backend dev
```

The backend listens on `http://localhost:4000`.

**Frontend** — Vite HMR dev server:

```bash
# Stop the frontend container
docker compose stop frontend

# Run frontend locally
pnpm --filter @custom-git-server/frontend dev
```

The frontend listens on `http://localhost:5173`.

Both services can be run simultaneously; Caddy proxy routes are typically bypassed in this mode and the services are accessed directly.

---

### 5. Running Tests

#### Backend tests

Integration and unit tests run via Vitest against the test database (`DATABASE_URL_TEST`). Postgres must be running (via `docker compose up postgres -d`).

```bash
pnpm --filter @custom-git-server/backend test
```

Watch mode:

```bash
pnpm --filter @custom-git-server/backend test:watch
```

#### Frontend tests

Unit and component tests (Vitest + Testing Library):

```bash
pnpm --filter @custom-git-server/frontend test
```

With coverage report:

```bash
pnpm --filter @custom-git-server/frontend test:cov
```

Playwright E2E tests (requires the full stack running):

```bash
pnpm --filter @custom-git-server/frontend test:e2e
```

#### Run all tests across workspaces

```bash
pnpm test
```

---

### 6. Workspace-Level Commands

These run across all workspaces via Turborepo:

```bash
pnpm build        # compile TypeScript for all apps
pnpm test         # run all tests
pnpm lint         # ESLint across all apps
pnpm typecheck    # tsc --noEmit for all apps
pnpm dev          # start all apps in dev/watch mode
```

Target a single workspace:

```bash
pnpm --filter @custom-git-server/backend build
pnpm --filter @custom-git-server/frontend build
```

---

### 7. Stopping and Resetting

Stop containers, preserve volumes (database data retained):

```bash
docker compose down
```

Full reset — stop containers and delete all volumes (destroys database data):

```bash
docker compose down -v
```

After a full reset, repeat [step 3](#3-database-setup-first-boot-or-after-schema-change) to re-apply migrations and re-seed.

---

### 8. Useful Runtime Commands

```bash
# Show all service statuses
docker compose ps

# Stream logs for all services
docker compose logs -f

# Stream logs for one service
docker compose logs -f backend

# Open a shell in a running container
docker compose exec backend sh
docker compose exec postgres psql -U git_platform -d git_platform
```

---

### 9. Access Points

| Endpoint | URL |
|---|---|
| Web UI | `https://localhost` |
| API | `https://localhost/api` |
| API health | `https://localhost/api/internal/health` |
| Git HTTPS | `https://localhost/<owner>/<repo>.git` |
| Git SSH | `ssh://git@localhost:2222/<owner>/<repo>.git` |

Caddy uses a self-signed certificate for `localhost`; accept the browser warning or add it to your trust store.

---

## Documentation

- [docs/design-fullstack.md](docs/design-fullstack.md) — architecture, service topology, auth model, DB schema
- [docs/tasks-fullstack.md](docs/tasks-fullstack.md) — implementation phases and task checklist
- [docs/README.md](docs/README.md) — legacy/POC-oriented guide (being superseded by fullstack flow)
