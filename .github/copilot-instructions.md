# Workspace Instructions

This is a self-hosted Git platform monorepo. Before performing any work, read the design and task documents in `docs/`.

## Key Documents

- [Design](../docs/design-fullstack.md) — authoritative architecture reference
- [Tasks](../docs/tasks-fullstack.md) — canonical task breakdown by phase
- [Backend agent](.github/instructions/backend.instructions.md) — backend hygiene and testing rules
- [Frontend agent](.github/instructions/frontend.instructions.md) — frontend hygiene and testing rules
- [Database agent](.github/instructions/database.instructions.md) — database hygiene and migration rules

## Project Structure

```text
apps/backend/     Fastify + Prisma + TypeScript API
apps/frontend/    Vite + React + TypeScript SPA
infra/git-server/ Git server container (nginx + sshd + fcgiwrap)
docs/             Design and task documents
keys/             Bind-mounted authorized_keys (gitignored)
repos/            Bind-mounted bare git repos (gitignored)
```

## General Rules

1. **Read first.** Before editing any file, read the relevant design doc section and current file contents. Do not guess existing implementations.
2. **One phase at a time.** Check `docs/tasks-fullstack.md` to identify what phase you are in. Do not implement future-phase features.
3. **Update tasks.** After completing a task, mark the corresponding checkbox in `docs/tasks-fullstack.md` as done `[x]`.
4. **No secrets in code.** Never hardcode passwords, tokens, or keys. All secrets come from environment variables defined in `.env.example`.
5. **TypeScript strict mode everywhere.** `"strict": true` in all tsconfigs. No `any` without an explicit comment justifying the exception.
6. **Test before marking done.** A task is only complete when all its specified tests pass.
7. **Preserve Git data path.** Do not change nginx `fcgiwrap` → `git-http-backend` wiring unless explicitly required by the current task.
8. **Docker-compose is the test environment.** All integration tests run inside compose. Never assume bare-metal port availability.
9. **Internal routes are internal.** `/internal/*` backend routes must never be added to Caddy routing. Verify after any Caddyfile change.
10. **Keep `.env.example` current.** Every new environment variable must be documented with a description and safe default in `.env.example` before the PR/commit.
