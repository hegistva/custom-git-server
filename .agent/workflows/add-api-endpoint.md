---
description: Step-by-step pattern for adding a new backend API endpoint
---

# Workflow: Add a New API Endpoint

Follow this pattern to add any new route to the Fastify backend.

## Step 1 — Read the Design Doc

Read the relevant section in `docs/design-fullstack.md` for the endpoint's:

- Request/response shape
- Auth requirements
- Error conditions

## Step 2 — Read Backend Instructions

Read `.github/instructions/backend.instructions.md` before writing any code.

## Step 3 — Prisma Schema (if needed)

If the endpoint requires new or modified tables:

1. Edit `apps/backend/prisma/schema.prisma`.
2. Create the migration:
   ```bash
   pnpm --filter @custom-git-server/backend db:migrate:dev -- --name <descriptive-name>
   ```
3. Regenerate the Prisma client:
   ```bash
   pnpm --filter @custom-git-server/backend prisma generate
   ```

## Step 4 — Service Layer

Create or update `apps/backend/src/services/<domain>.ts`:

```typescript
// src/services/example.ts
import { db } from '../lib/db.js';

export class ExampleNotFoundError extends Error {}
export class ExampleConflictError extends Error {}

export async function getExample(id: string, requestingUserId: string) {
  const record = await db.example.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, ownerId: true, createdAt: true },
  });

  if (!record) throw new ExampleNotFoundError();
  if (record.ownerId !== requestingUserId) throw new ExampleNotFoundError();

  return record;
}
```

Rules:

- No Fastify, no HTTP, no `request`/`reply` objects.
- Throws domain errors (subclasses of `Error`).
- Uses the `db` singleton — never `new PrismaClient()`.
- Always specify exact `select` fields; never return sensitive columns.

## Step 5 — Route Plugin

Create or update `apps/backend/src/routes/<domain>/index.ts`:

```typescript
// src/routes/example/index.ts
import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { getExample, ExampleNotFoundError } from '../../services/example.js';

const ParamsSchema = Type.Object({ id: Type.String() });
type Params = Static<typeof ParamsSchema>;

const ResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  createdAt: Type.String(),
});

const exampleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: Params }>(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: ParamsSchema,
        response: {
          200: ResponseSchema,
          404: Type.Object({ message: Type.String() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getExample(request.params.id, request.user.id);
        return result;
      } catch (err) {
        if (err instanceof ExampleNotFoundError) {
          throw fastify.httpErrors.notFound('Not found');
        }
        throw err;
      }
    },
  );
};

export default exampleRoutes;
```

## Step 6 — Register the Plugin

In `apps/backend/src/server.ts` (or the appropriate parent plugin):

```typescript
fastify.register(exampleRoutes, { prefix: '/examples' });
```

## Step 7 — Write Tests

Create `apps/backend/tests/integration/<domain>.test.ts`:

Required test cases per endpoint:

- ✅ Happy path: valid input → expected status + response shape
- ❌ Auth failure: missing/invalid JWT → 401
- ❌ Validation error: missing required field → 400
- ❌ Not found: non-existent resource → 404
- ❌ Ownership check: other user's resource → 403 or 404
- ❌ Conflict (if applicable): duplicate → 409

## Step 8 — Run and Verify

```bash
pnpm --filter @custom-git-server/backend test
pnpm --filter @custom-git-server/backend typecheck
pnpm --filter @custom-git-server/backend lint
```

All must pass with zero errors.

## Step 9 — Update tasks.md

Mark the completed task `[x]` in `docs/tasks-fullstack.md`.
