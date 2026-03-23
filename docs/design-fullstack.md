# Design: Fullstack Git Hosting Platform

## Goals

Extend the existing SSH + HTTPS Git POC with a fullstack management layer:

- User self-registration with username + password
- SSH public key upload and management (mapped to system `authorized_keys`)
- Personal Access Token (PAT) generation and revocation for HTTPS Basic Auth
- Repository creation and management (bare repos on filesystem)
- Owner-only access control for the MVP scope
- Single `docker compose up` startup for the entire stack
- Kubernetes-ready structure (service isolation, environment-variable-driven config)

---

## Monorepo Layout

```text
.
├── apps/
│   ├── backend/          # Fastify + Prisma + TypeScript API
│   └── frontend/         # Vite + React + TypeScript SPA
├── infra/
│   └── git-server/       # Existing Dockerfile, entrypoint.sh, nginx.conf
├── docs/
│   ├── README.md
│   ├── design-fullstack.md        (this file)
│   ├── design-http-auth-https.md
│   ├── tasks-fullstack.md
│   └── tasks-http-auth-https.md
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/
│       ├── backend.instructions.md
│       ├── frontend.instructions.md
│       └── database.instructions.md
├── repos/                # Bind-mounted bare git repos (gitignored)
├── keys/                 # Bind-mounted authorized_keys (gitignored)
├── auth/                 # Legacy htpasswd (kept for rollback, gitignored)
├── Caddyfile
├── docker-compose.yml
├── package.json          # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

---

## Service Topology

```text
┌─────────────────────────────────────────────────────────────────┐
│  docker compose                                                  │
│                                                                  │
│  ┌──────────┐   TLS+route   ┌─────────────┐                     │
│  │  caddy   │ ─────────────▶│  frontend   │  :5173 (Vite dev)   │
│  │  :80/443 │               │  (React SPA)│  :3000 (prod build) │
│  └────┬─────┘               └─────────────┘                     │
│       │ /api/*                                                   │
│       ▼                     ┌─────────────┐                     │
│  ┌──────────┐               │   backend   │  :4000              │
│  │  caddy   │ ─────────────▶│  (Fastify)  │                     │
│  └────┬─────┘               └──────┬──────┘                     │
│       │ /*.git/*                   │ Prisma ORM                 │
│       ▼                            ▼                             │
│  ┌──────────────┐          ┌─────────────┐                      │
│  │  git-server  │          │  postgres   │  :5432               │
│  │  (nginx+sshd)│          └─────────────┘                      │
│  └──────────────┘                                                │
│       ▲                                                          │
│  SSH  │ :2222                                                    │
└───────┼──────────────────────────────────────────────────────────┘
        │
    git client
```

### Port Summary

| Service    | Container Port | Host Port | Purpose                        |
| ---------- | -------------- | --------- | ------------------------------ |
| caddy      | 80             | 80        | HTTP → HTTPS redirect          |
| caddy      | 443            | 443       | TLS edge, routing              |
| frontend   | 3000           | —         | React SPA (via Caddy)          |
| backend    | 4000           | —         | API (via Caddy /api/\*)        |
| git-server | 22             | 2222      | SSH Git                        |
| git-server | 80             | —         | Git Smart HTTP (internal only) |
| postgres   | 5432           | —         | Database (internal only)       |

---

## Request Flows

### HTTPS Git (clone / push / fetch)

```text
git client
  → Caddy :443 (TLS termination, routes /<owner>/<repo>.git/*)
    → git-server:80 (nginx)
      → nginx auth_request /auth/git (internal subrequest)
        → backend:4000/internal/git-auth
          (validates Basic Auth credentials: username + PAT)
          (checks repo ownership / membership)
          → 200 OK + X-Auth-Username  /  401 Unauthorized
      → on 200: sets REMOTE_USER=$http_x_auth_username
      → fcgiwrap → git-http-backend
```

### SSH Git (clone / push / fetch)

```text
git client (ssh -p 2222)
  → git-server:22 (sshd)
    → git-shell (restricted to git operations)
    → key matched from /home/git/.ssh/authorized_keys
      (managed by backend when user adds/removes SSH keys)
    → git-upload-pack / git-receive-pack on /git-repos/<owner>/<repo>.git
```

### Web UI / API

```text
browser
  → Caddy :443
    → /* → frontend:3000 (React SPA)
    → /api/* → backend:4000 (Fastify, strips /api prefix)
```

---

## Authentication Model

### Web Session (SPA)

- Registration: `POST /api/auth/register` → hashed password stored, session JWT returned
- Login: `POST /api/auth/login` → JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Refresh: `POST /api/auth/refresh` → new access token if refresh token is valid
- Logout: `POST /api/auth/logout` → revokes refresh token

### HTTPS Git Auth (PAT-based)

- User generates a PAT from the UI: `POST /api/tokens`
- PAT is shown once; stored as bcrypt hash in DB linked to the user
- Git client uses: `https://<username>:<PAT>@<host>/<owner>/<repo>.git`
- nginx calls backend `/internal/git-auth` with `Authorization: Basic <b64>` header
- Backend verifies PAT hash and repo ownership; returns 200 or 401

### SSH Git Auth (key-based)

- User uploads public key via UI: `POST /api/ssh-keys`
- Backend appends canonical `command="..." authorized_keys` entry to the shared `authorized_keys` file
- Key format enforces `git-shell` restriction per entry
- Deletion removes the corresponding line
- The `authorized_keys` file is bind-mounted from `keys/authorized_keys`

---

## Database Schema

### Entity Diagram

```text
User (1) ──── (N) SshKey
User (1) ──── (N) PersonalAccessToken
User (1) ──── (N) Repository
Repository (N) ──── (N) RepositoryMembership ──── (N) User   [future]
```

### Tables

#### `users`

| Column        | Type        | Notes                        |
| ------------- | ----------- | ---------------------------- |
| id            | UUID PK     | `gen_random_uuid()`          |
| username      | TEXT UNIQUE | lowercase, 3-39 chars, regex |
| email         | TEXT UNIQUE | validated format             |
| password_hash | TEXT        | bcrypt, cost 12              |
| created_at    | TIMESTAMPTZ | default now()                |
| updated_at    | TIMESTAMPTZ | auto-updated                 |

#### `ssh_keys`

| Column      | Type        | Notes                            |
| ----------- | ----------- | -------------------------------- |
| id          | UUID PK     |                                  |
| user_id     | UUID FK     | → users.id, cascade delete       |
| label       | TEXT        | user-provided friendly name      |
| public_key  | TEXT        | full public key string           |
| fingerprint | TEXT UNIQUE | SHA-256 fingerprint, dedup guard |
| created_at  | TIMESTAMPTZ |                                  |

#### `personal_access_tokens`

| Column       | Type        | Notes                            |
| ------------ | ----------- | -------------------------------- |
| id           | UUID PK     |                                  |
| user_id      | UUID FK     | → users.id, cascade delete       |
| label        | TEXT        | user-provided friendly name      |
| token_hash   | TEXT        | bcrypt hash of the raw token     |
| token_prefix | TEXT        | first 8 chars for display/lookup |
| expires_at   | TIMESTAMPTZ | nullable, null = no expiry       |
| last_used_at | TIMESTAMPTZ | updated on each git auth check   |
| revoked_at   | TIMESTAMPTZ | nullable, null = active          |
| created_at   | TIMESTAMPTZ |                                  |

#### `repositories`

| Column                 | Type        | Notes                         |
| ---------------------- | ----------- | ----------------------------- |
| id                     | UUID PK     |                               |
| owner_id               | UUID FK     | → users.id, cascade delete    |
| name                   | TEXT        | slug, unique per owner        |
| description            | TEXT        | nullable                      |
| is_private             | BOOLEAN     | default true                  |
| disk_path              | TEXT        | absolute path on container fs |
| created_at             | TIMESTAMPTZ |                               |
| updated_at             | TIMESTAMPTZ |                               |
| UNIQUE(owner_id, name) |             |                               |

#### `refresh_tokens`

| Column     | Type        | Notes                         |
| ---------- | ----------- | ----------------------------- |
| id         | UUID PK     |                               |
| user_id    | UUID FK     | → users.id, cascade delete    |
| token_hash | TEXT UNIQUE | SHA-256 hash of the raw token |
| expires_at | TIMESTAMPTZ |                               |
| revoked_at | TIMESTAMPTZ | nullable                      |
| created_at | TIMESTAMPTZ |                               |

---

## API Surface

All routes are prefixed `/api`. Internal routes are only reachable within the Docker network.

### Auth

| Method | Path           | Auth   | Description                      |
| ------ | -------------- | ------ | -------------------------------- |
| POST   | /auth/register | none   | Register new user                |
| POST   | /auth/login    | none   | Login, returns JWT + sets cookie |
| POST   | /auth/refresh  | cookie | Rotate access token              |
| POST   | /auth/logout   | JWT    | Revoke refresh token             |
| GET    | /auth/me       | JWT    | Current user profile             |

### SSH Keys

| Method | Path          | Auth | Description            |
| ------ | ------------- | ---- | ---------------------- |
| GET    | /ssh-keys     | JWT  | List user's SSH keys   |
| POST   | /ssh-keys     | JWT  | Add new SSH public key |
| DELETE | /ssh-keys/:id | JWT  | Remove SSH key         |

### Personal Access Tokens

| Method | Path        | Auth | Description                         |
| ------ | ----------- | ---- | ----------------------------------- |
| GET    | /tokens     | JWT  | List tokens (metadata only)         |
| POST   | /tokens     | JWT  | Generate new PAT (returns raw once) |
| DELETE | /tokens/:id | JWT  | Revoke token                        |

### Repositories

| Method | Path                       | Auth | Description              |
| ------ | -------------------------- | ---- | ------------------------ |
| GET    | /repositories              | JWT  | List user's repositories |
| POST   | /repositories              | JWT  | Create new bare repo     |
| GET    | /repositories/:owner/:name | JWT  | Get repository metadata  |
| DELETE | /repositories/:owner/:name | JWT  | Delete repository        |

### Internal (Docker-network only, not exposed via Caddy)

| Method | Path               | Auth                 | Description                   |
| ------ | ------------------ | -------------------- | ----------------------------- |
| GET    | /internal/git-auth | Basic (username:PAT) | Validate git HTTP credentials |
| GET    | /internal/health   | none                 | Liveness probe                |
| GET    | /internal/ready    | none                 | Readiness probe               |

---

## Frontend Routes

| Path                | Component         | Auth Required | Description                      |
| ------------------- | ----------------- | ------------- | -------------------------------- |
| /                   | LandingPage       | no            | Marketing / redirect to login    |
| /register           | RegisterPage      | no            | User registration form           |
| /login              | LoginPage         | no            | Login form                       |
| /dashboard          | DashboardPage     | yes           | Repo list + quick actions        |
| /settings/ssh-keys  | SshKeysPage       | yes           | List / add / delete SSH keys     |
| /settings/tokens    | TokensPage        | yes           | List / generate / revoke PATs    |
| /repositories/new   | NewRepositoryPage | yes           | Create repository form           |
| /repositories/:name | RepositoryPage    | yes           | Repo detail + clone instructions |

---

## Infrastructure Changes from Current POC

### Caddy Changes

- Add routes for `/api/*` → `backend:4000`
- Add route for `/*` (non-git paths) → `frontend:3000`
- Remove static `basicauth` block (replaced by nginx `auth_request`)
- Keep `tls internal` and SSH passthrough

### nginx Changes

- Add `auth_request /auth-check` subrequest location for `*.git` paths
- Add internal `/auth-check` proxy location pointing to `backend:4000/internal/git-auth`
- Map `X-Auth-Username` response header from backend to `REMOTE_USER` FastCGI param
- Keep existing `fcgiwrap` → `git-http-backend` wiring unchanged

### Docker Compose Changes

- New services: `backend`, `frontend`, `postgres`
- New volumes: `postgres_data`
- New networks: keep `gitnet`, add `appnet` (backend ↔ postgres isolation)
- `git-server` gains environment vars for `BACKEND_URL`
- Backend gains volume mounts for `./repos` and `./keys` (manages bare repos and authorized_keys)
- Add `healthcheck` blocks for `postgres` and `backend`
- Add `profiles`: `dev` (hot reload), default (production-mode build)

---

## Migration Strategy

### Phase 1 (Parallel Operation)

- Static Caddy `basicauth` remains active
- New services (`backend`, `frontend`, `postgres`) are added and reachable
- nginx `auth_request` is configured as the default and only Git HTTPS auth path
- All existing SSH + HTTPS Git behavior is unaffected

### Phase 2 (Cutover)

- Static Caddy `basicauth` block is removed
- Users must register and generate a PAT to clone/push over HTTPS
- SSH keys uploaded via UI replace manual `authorized_keys` management

### Rollback

- Revert the Caddy/nginx auth-request changes in git history if a rollback is required
- Postgres data and registered users are preserved across rollback

---

## Security Considerations

- Passwords: bcrypt cost 12, never logged or returned in API responses
- PATs: generated with 32-byte crypto-random, shown once, stored as bcrypt hash
- JWTs: signed HS256
- Refresh tokens: SHA-256 hashed in DB, httpOnly cookie, SameSite=Strict
- `/internal/*` routes bound to Docker-internal network only (not in Caddy routing)
- SSH keys: fingerprint deduplication prevents re-adding the same key
- Repository disk paths validated against a known root prefix to prevent path traversal
- All inputs validated with TypeBox schemas at API boundary
- Rate limiting on `/api/auth/*` endpoints
- HTTPS-only; HTTP redirects to 443 via Caddy

---

## Non-Goals (MVP)

- Organization / team accounts
- Fine-grained per-repo collaborator ACLs (planned post-MVP via `RepositoryMembership`)
- Git LFS
- Webhooks
- Web-based repo browser / file viewer
- Email verification on registration
- OAuth / SSO
