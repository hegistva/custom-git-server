# Custom Git Server — AI Agent Context

> **Audience**: Antigravity (Google DeepMind) / Anthropic Claude coding agents.  
> This file is the **primary context** for any AI agent working in this repository.  
> Read it fully before touching any file or running any command.

---

## What This Project Is

A **self-hosted Git hosting platform** implemented as a `pnpm` monorepo with Turborepo.  
It mirrors the core of GitHub/Gitea but is intentionally minimal (MVP scope).

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Edge / TLS      | Caddy                                      |
| Git transport   | nginx + sshd + fcgiwrap + git-http-backend |
| API             | Fastify + Prisma + TypeScript (strict)     |
| Frontend        | Vite + React 18 + TypeScript (strict)      |
| Database        | Postgres 16 via Prisma ORM                 |
| Package manager | pnpm workspaces + Turborepo                |

---

## Monorepo Layout

```text
.
├── apps/
│   ├── backend/          # Fastify API + Prisma
│   └── frontend/         # React SPA (Vite)
├── infra/
│   └── git-server/       # nginx + sshd + fcgiwrap + git-http-backend
├── docs/                 # Authoritative design + task documents
├── keys/                 # Bind-mounted authorized_keys (gitignored)
├── repos/                # Bind-mounted bare git repos (gitignored)
├── .agent/               # AI agent context and workflows (this folder)
│   ├── agent.md          # ← you are here
│   └── workflows/        # Reusable step-by-step workflows
├── .github/              # GitHub Copilot instructions (do not delete)
│   ├── copilot-instructions.md
│   └── instructions/
│       ├── backend.instructions.md
│       ├── frontend.instructions.md
│       └── database.instructions.md
├── Caddyfile
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

---

## 🚦 Mandatory Pre-Work Protocol

**Before editing any file, an agent MUST:**

1. **Read the current phase** from `docs/tasks-fullstack.md` — identify the next unchecked `[ ]` task block.
2. **Read the relevant design section** from `docs/design-fullstack.md` for context on the feature.
3. **Read the relevant instruction file** for the area of work:
   - Backend code → `.github/instructions/backend.instructions.md`
   - Frontend code → `.github/instructions/frontend.instructions.md`
   - Database/Prisma → `.github/instructions/database.instructions.md`
4. **Read the file(s) you intend to edit** before writing any changes. Do not guess existing content.
5. **One phase at a time.** Do not implement features belonging to future phases.

---

## Key Documents (read before working)

| Document                                                                                            | Purpose                                                                |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`docs/design-fullstack.md`](../docs/design-fullstack.md)                                           | Authoritative architecture, DB schema, API surface, auth model         |
| [`docs/tasks-fullstack.md`](../docs/tasks-fullstack.md)                                             | Phase-by-phase task checklist — canonical source of truth for progress |
| [`.github/instructions/backend.instructions.md`](../.github/instructions/backend.instructions.md)   | Fastify/Prisma/TypeScript rules and testing requirements               |
| [`.github/instructions/frontend.instructions.md`](../.github/instructions/frontend.instructions.md) | React/Vite/TanStack rules and testing requirements                     |
| [`.github/instructions/database.instructions.md`](../.github/instructions/database.instructions.md) | Prisma schema, migration, and seed rules                               |

---

## Service Topology

```text
Browser / git CLI
    → Caddy :80/443 (TLS termination + routing)
        → /* → frontend:3000 (React SPA)
        → /api/* → backend:4000 (Fastify, strips /api prefix)
        → /<owner>/<repo>.git/* → git-server:80 (nginx)
            → auth_request → backend:4000/internal/git-auth
            → fcgiwrap → git-http-backend

git CLI (SSH)
    → git-server:22 (host port 2222)
        → sshd → git-shell
        → authorized_keys managed by backend
```

---

## Authentication Summary

| Credential type  | Storage                                                 | Lifetime        |
| ---------------- | ------------------------------------------------------- | --------------- |
| Password         | bcrypt hash (cost 12) in `users.password_hash`          | Permanent       |
| JWT access token | In-memory (frontend Zustand store)                      | 15 minutes      |
| Refresh token    | SHA-256 hash in `refresh_tokens` table, httpOnly cookie | 7 days          |
| PAT              | bcrypt hash in `personal_access_tokens` table           | Optional expiry |
| SSH key          | `authorized_keys` file + DB record                      | Until deleted   |

**Security rules:**

- Never log tokens, passwords, JWT payloads, or raw credentials.
- Never expose `/internal/*` routes via Caddy.
- Access tokens live in memory only — never `localStorage`.
- All secrets come from environment variables; nothing hardcoded.

---

## API Surface (Quick Reference)

### Public API (via Caddy `/api/*`)

| Method | Path                       | Auth   | Description                  |
| ------ | -------------------------- | ------ | ---------------------------- |
| POST   | /auth/register             | none   | Register user                |
| POST   | /auth/login                | none   | Login → JWT + refresh cookie |
| POST   | /auth/refresh              | cookie | Rotate access token          |
| POST   | /auth/logout               | JWT    | Revoke refresh token         |
| GET    | /auth/me                   | JWT    | Current user info            |
| GET    | /ssh-keys                  | JWT    | List SSH keys                |
| POST   | /ssh-keys                  | JWT    | Add SSH public key           |
| DELETE | /ssh-keys/:id              | JWT    | Remove SSH key               |
| GET    | /tokens                    | JWT    | List PATs (metadata only)    |
| POST   | /tokens                    | JWT    | Generate new PAT             |
| DELETE | /tokens/:id                | JWT    | Revoke PAT                   |
| GET    | /repositories              | JWT    | List repositories            |
| POST   | /repositories              | JWT    | Create repository            |
| GET    | /repositories/:owner/:name | JWT    | Get repo metadata            |
| DELETE | /repositories/:owner/:name | JWT    | Delete repository            |

### Internal (Docker-network only, never via Caddy)

| Method | Path               | Description                      |
| ------ | ------------------ | -------------------------------- |
| GET    | /internal/git-auth | Validate Basic Auth for git HTTP |
| GET    | /internal/health   | Liveness probe                   |
| GET    | /internal/ready    | Readiness probe                  |

---

## Database Schema (Prisma Models)

```text
User        → id, username (unique), email (unique), password_hash, createdAt, updatedAt
SshKey      → id, userId (FK→User, Cascade), label, public_key, fingerprint (unique), createdAt
PersonalAccessToken → id, userId (FK→User, Cascade), label, token_hash, token_prefix, expires_at?, revoked_at?, last_used_at?, createdAt
Repository  → id, owner_id (FK→User, Cascade), name, description?, is_private, disk_path, createdAt, updatedAt [UNIQUE(owner_id, name)]
RefreshToken → id, userId (FK→User, Cascade), token_hash (unique), expires_at, revoked_at?, createdAt
```

All tables use UUID PKs (`gen_random_uuid()`). All tables have `createdAt` / `updatedAt`.  
Sensitive records (users, repositories) use soft-delete (`deletedAt`). SSH keys are hard-deleted.

---

## Frontend Routes

| Path                | Page              | Auth Required |
| ------------------- | ----------------- | ------------- |
| /                   | LandingPage       | No            |
| /register           | RegisterPage      | No            |
| /login              | LoginPage         | No            |
| /dashboard          | DashboardPage     | Yes           |
| /settings/ssh-keys  | SshKeysPage       | Yes           |
| /settings/tokens    | TokensPage        | Yes           |
| /repositories/new   | NewRepositoryPage | Yes           |
| /repositories/:name | RepositoryPage    | Yes           |

---

## Critical Rules (All Agents Must Follow)

1. **Read before writing.** Always read existing file contents before editing.
2. **One phase at a time.** Only implement tasks in the current open phase of `docs/tasks-fullstack.md`.
3. **Update tasks.md.** After completing each task, mark the checkbox `[x]` in `docs/tasks-fullstack.md`.
4. **No secrets in code.** All secrets come from environment variables. Document new vars in `.env.example`.
5. **TypeScript strict mode.** `"strict": true` everywhere. No `any` without an inline justification comment.
6. **Tests before done.** A task is complete only when its specified tests pass.
7. **No internal route exposure.** Never add `/internal/*` routes to the Caddyfile.
8. **Preserve git data path.** Do not change nginx `fcgiwrap → git-http-backend` wiring unless the task requires it.
9. **Docker compose is the test environment.** Integration tests run inside compose. Never assume bare-metal availability.
10. **Keep `.env.example` current.** Every new env var must be in `.env.example` with description and safe default.

---

## Development Commands

### Start / Stop

```bash
docker compose up -d --build   # Start all services
docker compose down             # Stop, preserve data
docker compose down -v          # Stop + destroy volumes (destructive)
docker compose ps               # Check health
docker compose logs -f          # Stream all logs
docker compose logs -f backend  # Stream one service
```

### Local Dev (Hot Reload)

```bash
# Stop the container, run locally with hot reload
docker compose stop backend
pnpm --filter @custom-git-server/backend dev

docker compose stop frontend
pnpm --filter @custom-git-server/frontend dev
```

### Database

```bash
# Apply pending migrations (dev)
docker compose exec backend pnpm db:migrate

# Seed dev database
docker compose exec backend pnpm db:seed

# Create new migration (requires local Postgres on :5432)
pnpm --filter @custom-git-server/backend db:migrate:dev -- --name <name>
```

### Testing

```bash
pnpm test                                          # All tests (Turborepo)
pnpm --filter @custom-git-server/backend test      # Backend Vitest
pnpm --filter @custom-git-server/frontend test     # Frontend Vitest
pnpm --filter @custom-git-server/frontend test:e2e # Playwright E2E
pnpm --filter @custom-git-server/frontend test:cov # Coverage report
```

### Build / Lint / Typecheck

```bash
pnpm build      # Compile TypeScript for all apps
pnpm lint       # ESLint across all apps
pnpm typecheck  # tsc --noEmit for all apps
```

### Workspace-scoped commands

```bash
pnpm --filter @custom-git-server/backend build
pnpm --filter @custom-git-server/frontend build
```

---

## Access Points (when compose is running)

| Endpoint   | URL                                           |
| ---------- | --------------------------------------------- |
| Web UI     | `https://localhost`                           |
| API        | `https://localhost/api`                       |
| API health | `https://localhost/api/internal/health`       |
| Git HTTPS  | `https://localhost/<owner>/<repo>.git`        |
| Git SSH    | `ssh://git@localhost:2222/<owner>/<repo>.git` |

> Caddy uses a self-signed certificate for `localhost`. Accept the browser warning or add it to your trust store (`caddy-root.crt`).

---

## Backend Architecture Reference

```text
apps/backend/src/
├── plugins/          # Fastify plugins (auth, db, rate-limit, cors)
├── routes/           # Route handlers grouped by domain
│   ├── auth/         # POST /auth/register, /login, /refresh, /logout, GET /me
│   ├── ssh-keys/     # GET/POST/DELETE /ssh-keys
│   ├── tokens/       # GET/POST/DELETE /tokens
│   ├── repositories/ # GET/POST /repositories, GET/DELETE /repositories/:owner/:name
│   └── internal/     # /internal/health, /internal/ready, /internal/git-auth
├── services/         # Business logic (no HTTP concerns)
├── lib/              # Pure utilities (db singleton, crypto, ssh-key parser, repo path)
└── types/            # Shared TypeScript types
```

Key rules:

- TypeBox (`@sinclair/typebox`) for all schema validation — no Zod on the backend.
- `fastify.inject()` for integration tests — not supertest.
- `request.log` for logging — never `console.log`.
- `@fastify/sensible` `httpErrors` for all HTTP error creation.
- Prisma errors translated: P2002 → 409, P2025 → 404.

---

## Frontend Architecture Reference

```text
apps/frontend/src/
├── api/              # API client functions, one file per domain
├── components/ui/    # Generic: Button, Input, Modal, Badge
├── components/layout/# AppShell, Navbar, Sidebar
├── features/         # Feature-scoped components and hooks
├── pages/            # Route-level page components (thin, compose features)
├── hooks/            # Generic custom hooks
├── lib/              # api client config, zod schemas, queryKeys
├── store/            # Zustand auth store
└── types/            # Shared TypeScript interfaces
```

Key rules:

- Zod for all form validation on the frontend (not TypeBox).
- TanStack Query for all server state — no `useEffect` for data fetching.
- Access token in Zustand memory only — never `localStorage`.
- All API calls through `src/lib/api.ts` instance — never raw `fetch()`.
- `react-hook-form` + `zodResolver` for all forms.
- `shadcn/ui` component library preferred for UI components.

---

## UI Component Library

This project uses **shadcn/ui** as the preferred component library.

- Components live in `apps/frontend/src/components/ui/`
- Install new components with: `pnpm --filter @custom-git-server/frontend dlx shadcn@latest add <component>`
- Always use shadcn components before writing custom ones for: Button, Input, Form, Dialog, Badge, Card, Table, Toast, etc.
- Theme tokens follow the shadcn/Tailwind CSS variable convention.

---

## Workflows

See the `.agent/workflows/` directory for step-by-step workflows:

| Workflow                | File                             | Description                                           |
| ----------------------- | -------------------------------- | ----------------------------------------------------- |
| Implement a phase       | `workflows/implement-phase.md`   | How to pick up, implement, and close out a task phase |
| Run tests               | `workflows/run-tests.md`         | How to run the full test suite and interpret results  |
| Dev environment setup   | `workflows/dev-setup.md`         | First-time setup and compose startup                  |
| Add a new API endpoint  | `workflows/add-api-endpoint.md`  | Step-by-step pattern for backend routes               |
| Add a new frontend page | `workflows/add-frontend-page.md` | Step-by-step pattern for React pages                  |
| Database migration      | `workflows/db-migration.md`      | Safe migration creation and application               |

---

## Current Implementation Progress

See `docs/tasks-fullstack.md` for the live checklist.

**Phases completed:** 0, 1, 2, 3 (monorepo scaffold, backend + DB + frontend scaffold)  
**Current phase:** 4 — Auth Feature (register, login, refresh, logout, JWT guards)  
**Remaining phases:** 5 (SSH keys), 6 (PATs), 7 (Repositories), 8 (nginx auth_request), 9 (Caddy routing), 10 (DX polish), 11 (Docs refresh)
