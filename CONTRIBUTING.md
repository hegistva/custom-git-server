# Contributing

## Prerequisites

- Node.js 20+
- pnpm
- Docker and Docker Compose

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create local environment file:

```bash
cp .env.example .env
```

3. Start full stack (production-like):

```bash
docker compose up -d --build
```

4. Start app watch mode only (backend + frontend):

```bash
pnpm dev
```

5. Start full stack with dev profile and hot-reload mounts:

```bash
pnpm dev:stack
```

## Quality Checks

Run before opening a PR:

```bash
pnpm lint
pnpm test
pnpm build
pnpm typecheck
```

- `pnpm lint`: ESLint + Prettier checks across workspaces
- `pnpm test`: backend + frontend unit tests and frontend Playwright E2E
- `pnpm build`: production builds for all apps
- `pnpm typecheck`: TypeScript type checks for all apps

## Formatting Policy

- Prettier is the source of truth for formatting.
- VS Code workspace settings are configured to format on save.
- Agent sessions run `.github/hooks/format-on-stop.json` which invokes `scripts/format-on-stop.sh` to ensure formatting is applied and checked before the session ends.

## Task Tracking

Update task completion in `docs/tasks-fullstack.md` only after implementation and validation are complete.
