---
description: How to implement a task phase from docs/tasks-fullstack.md end-to-end
---

# Workflow: Implement a Phase

Follow these steps in order every time you start work on a new phase.

## Step 1 — Identify the Current Phase

1. Read `docs/tasks-fullstack.md` in full.
2. Find the lowest-numbered phase with any unchecked `[ ]` tasks. That is the **current phase**.
3. Note every `[ ]` task in that phase — those are your work items.
4. Do not implement tasks from any future phase.

## Step 2 — Read the Design Doc

1. Open `docs/design-fullstack.md`.
2. Find the sections relevant to the current phase (API surface, DB schema, auth model, service topology as needed).
3. Note any constraints, data shapes, or security requirements called out for the feature.

## Step 3 — Read the Instruction Files

Read only the files relevant to your current work:

- Backend tasks → `.github/instructions/backend.instructions.md`
- Frontend tasks → `.github/instructions/frontend.instructions.md`
- Database/Prisma tasks → `.github/instructions/database.instructions.md`

## Step 4 — Read Files Before Editing

Before modifying any source file:

1. View the file with the view-file tool.
2. Understand its current structure.
3. Plan your changes without guessing.

## Step 5 — Implement Backend Tasks (if any in this phase)

Follow this sub-order for backend tasks:

1. **Schema / migration first** (if new tables or columns are needed):
   - Edit `apps/backend/prisma/schema.prisma`
   - Run migration: `pnpm --filter @custom-git-server/backend db:migrate:dev -- --name <descriptive-name>`
   - Update `prisma/seed.ts` if seed data changes are needed
   - Run `pnpm --filter @custom-git-server/backend db:seed` to verify

2. **Service layer** — business logic in `apps/backend/src/services/<domain>.ts`:
   - No Fastify or HTTP concerns
   - Throws domain errors (not HTTP errors)
   - Uses the Prisma singleton from `src/lib/db.ts`

3. **Route plugin** — HTTP interface in `apps/backend/src/routes/<domain>/index.ts`:
   - TypeBox schema for body, query, params, response
   - Translates service domain errors → HTTP errors via `fastify.httpErrors`
   - Uses `onRequest: [fastify.authenticate]` for protected routes

4. **Tests** — in `apps/backend/tests/integration/` and `tests/unit/`:
   - Minimum required cases per endpoint (see `backend.instructions.md`)
   - Run: `pnpm --filter @custom-git-server/backend test`

## Step 6 — Implement Frontend Tasks (if any in this phase)

Follow this sub-order for frontend tasks:

1. **Types** — Add or update `apps/frontend/src/types/<domain>.ts` matching API response shapes.

2. **Zod schemas** — Add form/input schemas to `apps/frontend/src/lib/schemas/<domain>.ts`.

3. **API client function** — Add to `apps/frontend/src/api/<domain>.ts`, using the `src/lib/api.ts` instance.

4. **Query keys** — Add to `apps/frontend/src/lib/queryKeys.ts`.

5. **Feature components** — Build in `apps/frontend/src/features/<domain>/`.

6. **Page component** — Wire features together in `apps/frontend/src/pages/<PageName>.tsx`.

7. **Route** — Register in `apps/frontend/src/pages/routes.tsx` with appropriate auth guard.

8. **Tests** — in `apps/frontend/tests/unit/`:
   - Smoke test (renders without throwing)
   - Visible content tests
   - Form validation tests
   - Run: `pnpm --filter @custom-git-server/frontend test`

## Step 7 — Run All Tests

// turbo

```bash
pnpm test
```

All tests must pass before proceeding.

## Step 8 — Check Lint and Types

// turbo

```bash
pnpm lint && pnpm typecheck
```

Zero warnings, zero errors required.

## Step 9 — Mark Tasks Complete

For each completed task in `docs/tasks-fullstack.md`, change `[ ]` to `[x]`.

Only mark a task complete if:

- Implementation exists
- Relevant tests pass
- Lint and typecheck pass

## Step 10 — Summarise

Report what was implemented, what tests were added, and what the next open phase is.
