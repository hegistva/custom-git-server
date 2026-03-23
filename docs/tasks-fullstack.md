# Tasks: Fullstack Git Hosting Platform

Reference design: [design-fullstack.md](design-fullstack.md)

---

## Phase 0 — Monorepo Root Setup

- [x] Move `Dockerfile`, `entrypoint.sh`, `nginx.conf` to `infra/git-server/`
- [x] Update `docker-compose.yml` build context for `git-server` to `./infra/git-server`
- [x] Create `apps/` directory stub (empty `backend/` and `frontend/` folders)
- [x] Create root `package.json` with `pnpm` workspace config and workspace scripts
- [x] Create `pnpm-workspace.yaml` pointing to `apps/*`
- [x] Create `turbo.json` with pipeline definitions for `build`, `dev`, `lint`, `test`
- [x] Create `.env.example` with all required variables documented
- [x] Create `.env` (gitignored) copied from `.env.example` for local dev
- [x] Verify `docker compose up -d --build` still works with moved infra files

---

## Phase 1 — Backend Scaffold

- [x] Init `apps/backend` with `pnpm create` or manual scaffold
- [x] Configure TypeScript (`tsconfig.json`, strict mode, path aliases)
- [x] Add Fastify, `@fastify/cors`, `@fastify/cookie`, `@fastify/helmet`
- [x] Add TypeBox for schema validation (`@sinclair/typebox`)
- [x] Add `pino` logging (Fastify built-in)
- [x] Add Prisma (`prisma`, `@prisma/client`)
- [x] Add Vitest + Supertest for testing
- [x] Scaffold folder structure: `src/plugins/`, `src/routes/`, `src/services/`, `src/lib/`, `src/types/`
- [x] Implement `/internal/health` and `/internal/ready` endpoints
- [x] Add Dockerfile for backend (`apps/backend/Dockerfile`)
- [x] Add `backend` service to `docker-compose.yml` with health check
- [x] Verify backend starts and health check passes in compose

---

## Phase 2 — Database Setup

- [x] Add `postgres` service to `docker-compose.yml` with `postgres_data` volume and health check
- [x] Configure Prisma `DATABASE_URL` via environment variable
- [x] Create initial Prisma schema: `User`, `SshKey`, `PersonalAccessToken`, `Repository`, `RefreshToken`
- [x] Create and apply initial migration (`prisma migrate dev --name init`)
- [x] Add `db:migrate` and `db:seed` scripts to `package.json`
- [x] Create seed file with at least one test user for local dev
- [x] Add Prisma client singleton to `src/lib/db.ts`
- [x] Verify `prisma migrate deploy` runs cleanly in compose on fresh volume
- [x] Verify DB connection from backend health check

---

## Phase 3 — Frontend Scaffold

- [x] Init `apps/frontend` with `pnpm create vite` (React + TypeScript template)
- [x] Configure TypeScript (`tsconfig.json`, strict mode, path aliases)
- [x] Add TanStack Query (`@tanstack/react-query`)
- [x] Add Zustand for auth state
- [x] Add React Router v7 (`react-router-dom`)
- [x] Add React Hook Form + Zod for form validation
- [x] Add `ky` for HTTP client (thin wrapper in `src/lib/api.ts`)
- [x] Add Vitest + Testing Library (`@testing-library/react`) for unit tests
- [x] Add Playwright for E2E tests
- [x] Scaffold page components as stubs: `LandingPage`, `LoginPage`, `RegisterPage`, `DashboardPage`, `SshKeysPage`, `TokensPage`, `NewRepositoryPage`, `RepositoryPage`
- [x] Implement route definitions with `React Router` (guarded routes for auth-required pages)
- [x] Add `AuthContext` and `ProtectedRoute` component
- [x] Add Dockerfile for frontend (`apps/frontend/Dockerfile`)
- [x] Add `frontend` service to `docker-compose.yml`
- [x] Verify frontend serves at expected path via Caddy

---

## Phase 4 — Auth Feature

### Backend

- [x] Implement `POST /api/auth/register` with TypeBox validation, bcrypt hash (cost 12)
- [x] Implement `POST /api/auth/login` returning JWT access token + httpOnly refresh token cookie
- [x] Implement `POST /api/auth/refresh` validating refresh token, rotating tokens
- [x] Implement `POST /api/auth/logout` revoking refresh token in DB
- [x] Implement `GET /api/auth/me` returning current user (JWT guard)
- [x] Add rate limiting on all `/api/auth/*` routes (`@fastify/rate-limit`)
- [x] Write tests: register (happy path, duplicate username, duplicate email, invalid input)
- [x] Write tests: login (happy path, wrong password, unknown user)
- [x] Write tests: refresh (happy path, expired token, revoked token)
- [x] Write tests: logout (happy path, already logged out)
- [x] Write tests: me (authenticated, unauthenticated)

### Frontend

- [x] Implement `RegisterPage` form with validation (username, email, password, confirm password)
- [x] Implement `LoginPage` form with validation
- [x] Wire auth pages to backend via TanStack Query mutations
- [x] Implement token storage in auth store (access token in memory only)
- [x] Implement silent refresh on 401 responses in API client
- [x] Implement `ProtectedRoute` redirect to login on missing auth
- [x] Write component tests: RegisterPage renders and validates
- [x] Write component tests: LoginPage renders and validates
- [x] Write component tests: DashboardPage renders and handles logout
- [x] Write E2E test: full register → login flow
- [x] Implement logout functionality on the frontend and connect to backend logout

---

## Phase 5 — SSH Key Management

### Backend

- [x] Implement `GET /api/ssh-keys` returning user's keys
- [x] Implement `POST /api/ssh-keys` validating SSH public key format, computing fingerprint, appending to `authorized_keys`
- [x] Implement `DELETE /api/ssh-keys/:id` removing key from DB and `authorized_keys`
- [x] Implement SSH key parsing utility in `src/lib/ssh-key.ts` (parse format, extract fingerprint)
- [x] Add volume mount for `keys/` directory in backend container
- [x] Write tests: list (empty list, populated list)
- [x] Write tests: add (happy path, invalid key format, duplicate fingerprint)
- [x] Write tests: delete (happy path, not found, wrong owner)

### Frontend

- [x] Implement `SshKeysPage`: list view with add form and delete buttons
- [x] Wire to backend API via TanStack Query
- [x] Show fingerprint and creation date for each key
- [x] Write component tests: SshKeysPage renders key list
- [x] Write component tests: add key form validates and submits
- [x] Create routes and navigation to the ssh keys feature on the front-end and test it

---

## Phase 6 — Personal Access Tokens

### Backend

- [x] Implement `GET /api/tokens` returning token metadata (no raw token, prefix only)
- [x] Implement `POST /api/tokens` generating 32-byte random token, bcrypt-hashing, storing prefix
- [x] Implement `DELETE /api/tokens/:id` setting `revoked_at` timestamp
- [x] Implement `GET /internal/git-auth` decoding Basic Auth header, looking up user by username, checking PAT hash against non-revoked tokens, checking repo ownership
- [x] Write tests: list tokens (empty, populated)
- [x] Write tests: create token (happy path, label required)
- [x] Write tests: revoke token (happy path, not found, wrong owner)
- [x] Write tests: git-auth (valid PAT, wrong PAT, revoked PAT, unknown user, missing auth header)

### Frontend

- [x] Implement `TokensPage`: list metadata, generate PAT with one-time reveal modal, revoke button
- [x] Wire to backend API
- [x] Add one-time reveal component (shows raw token once after creation, then hides)
- [x] Write component tests: token list renders, revoke triggers mutation
- [x] Write component tests: generate shows confirmation modal with token value

---

## Phase 7 — Repository Management

### Backend

- [x] Implement `GET /api/repositories` returning user's repositories
- [x] Implement `POST /api/repositories` creating a bare repo on disk via `git init --bare`, recording in DB
- [x] Implement `GET /api/repositories/:owner/:name` returning repo metadata
- [x] Implement `DELETE /api/repositories/:owner/:name` removing DB record and deleting directory
- [x] Implement repo path resolver utility in `src/lib/repo.ts` (safe path construction, prefix validation)
- [x] Add volume mount for `repos/` directory in backend container
- [x] Update `/internal/git-auth` to verify repository exists and requester is owner (or member, future)
- [x] Write tests: list (empty, populated)
- [x] Write tests: create (happy path, duplicate name, invalid name format)
- [x] Write tests: get (happy path, not found, different owner)
- [x] Write tests: delete (happy path, not found, wrong owner)

### Frontend

- [x] Implement `DashboardPage`: repo list with links and "New repository" button
- [x] Implement `NewRepositoryPage`: form for name, description, private/public toggle
- [x] Implement `RepositoryPage`: metadata display + SSH clone URL + HTTPS clone URL with PAT instructions
- [x] Implement delete repository button with confirmation modal on `RepositoryPage`
- [x] Wire all pages to backend API
- [x] Write component tests: DashboardPage renders repo list
- [x] Write component tests: NewRepositoryPage validates name format and submits
- [x] Write E2E test: login → create repository → navigate to repo detail

---

## Phase 8 — nginx Auth Request Integration

- [x] Add `auth_request` directive to nginx `*.git` location block
- [x] Add internal `/auth-check` location proxying to `backend:4000/internal/git-auth`
- [x] Map `X-Auth-Username` response header to `REMOTE_USER` FastCGI param
- [x] Add env var `GIT_AUTH_BACKEND` to `git-server` container
- [x] Implement conditional nginx config (template or env-switched) for Phase 1 parallel operation
- [x] Write integration test: valid PAT → 200 on Git info/refs endpoint
- [x] Write integration test: invalid PAT → 401
- [x] Write integration test: unauthenticated → 401
- [x] Verify `git clone`, `git push`, `git fetch` work end-to-end over HTTPS with PAT
- [x] Verify SSH clone / push unchanged after changes

---

## Phase 9 — Caddy Routing Update

- [x] Add `/api/*` → `backend:4000` route in Caddyfile
- [x] Add `/*` fallback → `frontend:3000` route for SPA (with proper index.html fallback)
- [x] Adjust `*.git` route to no longer require `basicauth` (auth moved to nginx auth_request)
- [x] Verify HTTPS redirect still works
- [x] Verify UI accessible at `https://localhost`
- [x] Verify API accessible at `https://localhost/api/*`
- [x] Verify Git HTTPS accessible at `https://localhost/<owner>/<repo>.git`

---

## Phase 10 — Developer Experience Polish

- [ ] Add `turbo run dev` to start all services in watch mode (frontend + backend hot reload)
- [ ] Add `turbo run test` pipeline running backend Vitest + frontend Vitest + Playwright
- [ ] Add `turbo run lint` via ESLint + Prettier across both apps
- [ ] Add `turbo run build` for production builds
- [ ] Add `docker compose --profile dev` override for hot-reload mounts
- [ ] Document local dev setup in `docs/README.md`
- [ ] Add `CONTRIBUTING.md` with environment setup steps

---

## Phase 11 — Documentation Refresh

- [ ] Update `docs/README.md` with new full-stack architecture, startup guide, and user workflow
- [ ] Update `docs/design-http-auth-https.md` to mark static auth as deprecated
- [ ] Update `docs/tasks-http-auth-https.md` to mark relevant tasks as superseded
- [ ] Add architecture diagram to `docs/README.md`

---

## Verification Checklist (End-to-End)

- [ ] `pnpm install` succeeds from repo root
- [ ] `pnpm turbo run build` succeeds for all workspaces
- [ ] `docker compose up -d --build` brings all 5 services healthy
- [ ] Fresh DB volume: Prisma migration applies and seed runs
- [ ] Register → login flow works in browser
- [ ] Add SSH key → SSH `git clone` succeeds on port 2222
- [ ] Generate PAT → HTTPS `git clone` succeeds with username:PAT
- [ ] Create repository → appears in UI and can be cloned
- [ ] All backend tests pass: `pnpm turbo run test --filter=backend`
- [ ] All frontend tests pass: `pnpm turbo run test --filter=frontend`
- [ ] Playwright E2E: register → login → create repo → clone URL displayed
- [ ] Unauthenticated HTTPS Git request returns 401
- [ ] Unauthorized repo access (different user's PAT) returns 403
