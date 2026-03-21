---
applyTo: "apps/backend/prisma/**"
---

# Database Development Instructions

Stack: **Postgres 16 + Prisma ORM**

---

## Schema Design Rules

### Naming Conventions

- Table names: **snake_case plural** (e.g. `users`, `ssh_keys`, `personal_access_tokens`).
- Column names: **snake_case** (e.g. `created_at`, `token_hash`, `owner_id`).
- Prisma model names: **PascalCase singular** (e.g. `User`, `SshKey`, `PersonalAccessToken`).
- Prisma field names: **camelCase** (e.g. `createdAt`, `tokenHash`, `ownerId`).
- Use `@map` and `@@map` to bridge Prisma naming to DB naming conventions.

### Primary Keys

- All tables use `UUID` primary keys generated with `gen_random_uuid()` via `@default(dbgenerated("gen_random_uuid()")) @db.Uuid`.
- Never use auto-increment integers as primary keys. UUIDs prevent enumeration attacks.

### Timestamps

Every table **must** have:

```prisma
createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
updatedAt  DateTime  @updatedAt       @map("updated_at") @db.Timestamptz(6)
```

Exception: join tables and immutable event records may omit `updatedAt`.

### Soft Deletes

- Sensitive or auditable records (users, repositories, tokens) use soft delete via `deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)`.
- Cascade hard deletes are acceptable for dependent records (e.g. SSH keys cascade-deleted when a user is hard-deleted).
- All queries on soft-deletable models must include `WHERE deleted_at IS NULL` or the Prisma equivalent.
- Hard delete is forbidden for `users` and `repositories` in application code; set `deletedAt` instead.

### Foreign Keys

- Always define `@relation` with explicit `fields`, `references`, and `onDelete` action.
- Use `Cascade` for child records that cannot exist without the parent (e.g. SSH keys → user).
- Use `Restrict` when deletion of the parent should be blocked if children exist.
- Never use `NoAction` or `SetNull` unless specifically justified with a comment.

### Indexes

- Every foreign key column must have a corresponding `@@index`.
- Add `@@unique` or `@unique` for any column that is logically unique (fingerprints, usernames, emails).
- Add a composite `@@unique` for `(ownerId, name)` on `repositories`.
- Do not add speculative indexes. Only add an index when a query that uses it exists or is planned in the current phase.

---

## Migration Rules

### Creating Migrations

```bash
# From apps/backend:
pnpm prisma migrate dev --name <descriptive-name>
```

Migration names must be **descriptive and present-tense**:
- ✅ `add-refresh-tokens-table`
- ✅ `add-fingerprint-index-to-ssh-keys`
- ❌ `update`, `fix`, `changes`, `migration1`

### Migration Hygiene

- **Never edit an existing migration file.** Create a new migration to fix mistakes.
- **Never use `prisma db push` in any environment but a throwaway local sandbox.** Always use `prisma migrate dev` for schema changes.
- Every migration must be reviewed for:
  - Backward compatibility (can the old app version still run against the new schema?)
  - Destructive operations (DROP COLUMN, DROP TABLE): flag these with a comment and ensure data is irrelevant or backed up.
  - Lock risk: adding a NOT NULL column without a default blocks writes on large tables.
- Destructive migrations must be listed explicitly in the PR/commit message.

### Applying Migrations

```bash
# Development (local compose):
pnpm prisma migrate dev

# Production / CI (no interactive prompts):
pnpm prisma migrate deploy
```

`migrate deploy` is used in the backend Docker container's startup entrypoint.

---

## Seed Data

- Seed file: `prisma/seed.ts`
- The seed must be idempotent (safe to run multiple times). Use `upsert` not `create`.
- Seed creates at minimum: one local dev user with a known username/password documented in `.env.example`.
- Seed must **not** run in production (`NODE_ENV=production`). Add a guard at the top of the seed script:

```typescript
if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed must not run in production');
}
```

```bash
pnpm prisma db seed
```

---

## Prisma Client Usage

### Singleton

The Prisma client is instantiated once in `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- Import only `db` from this file. Never create `new PrismaClient()` elsewhere.

### Query Safety

- Never trust user input for `where` clauses beyond validated and typed parameters.
- Do not use `prisma.$queryRaw` or `prisma.$executeRaw` unless there is no ORM equivalent. If used, always use tagged template literals (never string concatenation) to prevent SQL injection.
- Always specify the exact fields to return using `select` or `include`. Do not return entire rows if some columns are sensitive (e.g. `passwordHash`, `tokenHash`).

### Transactions

Use `prisma.$transaction([...])` when two or more write operations must succeed or fail together:

```typescript
// Good:
await db.$transaction([
  db.personalAccessToken.update({ where: { id }, data: { revokedAt: new Date() } }),
  db.auditLog.create({ data: { ... } }),
]);
```

---

## Testing Requirements

### Test Database

- Tests use a separate Postgres DB specified by `DATABASE_URL_TEST` env var.
- `beforeAll`: apply all pending migrations via `execSync('pnpm prisma migrate deploy')`.
- `afterEach`: truncate all relevant tables in reverse dependency order (children before parents) using a `truncateTables()` fixture helper.
- `afterAll`: disconnect Prisma client.

### What to Test

| Scenario                         | Required                                       |
|----------------------------------|------------------------------------------------|
| Unique constraint violation      | Returns `PrismaClientKnownRequestError` P2002  |
| FK cascade delete                | Child records removed when parent deleted      |
| Soft delete filter               | Soft-deleted records excluded from default query|
| Nullable field handling          | Null and non-null variants both persist correctly|
| Composite unique constraint      | Duplicate `(owner_id, name)` rejected           |

### Factories

All test entity creation goes through factory functions in `tests/fixtures/`:

```typescript
// tests/fixtures/user.factory.ts
export async function createUser(overrides?: Partial<UserCreateInput>) {
  return db.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password', 12),
      ...overrides,
    },
  });
}
```

- Factories must not assume a specific database state (no `findFirst` without creating first).
- Factories must be the only place inline entity data is defined in tests.

---

## Schema Version Control

- `prisma/schema.prisma` is always committed.
- `prisma/migrations/` directory is always committed in full.
- Generated client (`node_modules/.prisma/`) is never committed.
- Run `pnpm prisma generate` after any schema change; add this to the `postinstall` script.
