---
description: Safe Prisma migration creation and application
---

# Workflow: Database Migration

Follow this workflow any time the Prisma schema needs to change.

## Step 1 — Read Database Instructions

Read `.github/instructions/database.instructions.md` before making any schema changes.

## Step 2 — Edit the Schema

Edit `apps/backend/prisma/schema.prisma`.

Rules:
- Table names: `snake_case plural` (mapped with `@@map`)
- Column names: `snake_case` (mapped with `@map`)
- Prisma model names: `PascalCase singular`
- All tables need: UUID PK, `createdAt`, `updatedAt` (exception: join tables, immutable events)
- Sensitive/auditable records: add `deletedAt DateTime?` for soft delete
- All FK columns: add corresponding `@@index`
- Never use `NoAction` or `SetNull` for `onDelete` without a comment

## Step 3 — Create the Migration

Requires a running Postgres instance (use `docker compose up postgres -d`):

```bash
# From the repo root:
pnpm --filter @custom-git-server/backend db:migrate:dev -- --name <descriptive-name>
```

Migration name rules:
- ✅ `add-refresh-tokens-table`
- ✅ `add-fingerprint-index-to-ssh-keys`
- ❌ `update`, `fix`, `changes`, `migration1`

## Step 4 — Review the Generated SQL

Open the newly created file in `apps/backend/prisma/migrations/<timestamp>_<name>/migration.sql`.

Check for:
- **Destructive operations**: DROP COLUMN, DROP TABLE — flag these explicitly
- **Lock risk**: Adding NOT NULL columns without a default on large tables
- **Backward compatibility**: Can the old app version still run against the new schema?

## Step 5 — Regenerate the Prisma Client

```bash
pnpm --filter @custom-git-server/backend prisma generate
```

This is run automatically by `postinstall`, but run it manually after schema changes.

## Step 6 — Update Seed (if needed)

If the schema change requires seed data updates, edit `apps/backend/prisma/seed.ts`.

Rules:
- Seed must be idempotent (use `upsert`, not `create`)
- Seed must not run in production (guard at top: `if (process.env.NODE_ENV === 'production') throw`)

Test the seed:
```bash
docker compose exec backend pnpm db:seed
```

## Step 7 — Verify Migration in Compose

```bash
docker compose exec backend pnpm db:migrate
```

This runs `prisma migrate deploy` (non-interactive, for CI and production).

## Step 8 — Update Tasks

If the migration was part of a phase task, mark it `[x]` in `docs/tasks-fullstack.md`.

## Never Do This

- ❌ Never edit an existing migration file
- ❌ Never use `prisma db push` outside a throwaway local sandbox
- ❌ Never commit `node_modules/.prisma/` (generated client)
- ❌ Never add NOT NULL columns without a default on large tables without a plan
