---
applyTo: "apps/backend/**"
---

# Backend Development Instructions

Stack: **Node 20 + TypeScript (strict) + Fastify + Prisma + Postgres**

---

## Project Structure

```text
apps/backend/
├── src/
│   ├── plugins/          # Fastify plugins (auth, db, rate-limit, cors)
│   ├── routes/           # Route handlers grouped by domain
│   │   ├── auth/
│   │   ├── ssh-keys/
│   │   ├── tokens/
│   │   ├── repositories/
│   │   └── internal/
│   ├── services/         # Business logic (no HTTP concerns)
│   ├── lib/              # Utilities (db singleton, crypto, ssh-key parser, repo path)
│   └── types/            # Shared TypeScript types and interfaces
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/             # Pure function / service tests
│   ├── integration/      # Endpoint tests using Fastify inject
│   └── fixtures/         # Shared test data factories
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## TypeScript Rules

- `"strict": true` is mandatory. Never disable strictness or downcast to `any` without an inline comment explaining why.
- Use `unknown` over `any` for input that has not been validated.
- Use TypeBox (`@sinclair/typebox`) for all runtime schema definitions. Do not write separate Zod schemas on the backend.
- Request body, query params, route params, and response shapes must all have TypeBox schemas declared in the route file.
- Infer TypeScript types from TypeBox schemas with `Static<typeof Schema>`.
- Never use `as` type assertions to bypass TypeBox validation output types.

---

## Fastify Conventions

- Register all routes through plugins. Never call `fastify.route()` in the main server file.
- Each domain gets its own plugin file under `src/routes/<domain>/index.ts`.
- Every route must declare:
  - `schema.body` (if applicable)
  - `schema.querystring` (if applicable)
  - `schema.params` (if applicable)
  - `schema.response` with at least a `200` and `4xx` shape
- Use `fastify.inject()` (not `supertest`) for integration tests.
- Decorate `fastify.db` with the Prisma client via a plugin registered before routes.
- Use `request.user` (decorated by auth plugin) inside route handlers; never re-decode JWTs in routes.
- All auth-protected routes use `onRequest: [fastify.authenticate]` preHandler hook.
- Log with `request.log` (child logger bound to request id), never `console.log`.

---

## Error Handling

- Use `fastify.httpErrors` (from `@fastify/sensible`) for all HTTP error creation.
- Never return raw Prisma errors to the client. Catch `PrismaClientKnownRequestError` and translate:
  - P2002 (unique constraint) → 409 Conflict with a human-readable message
  - P2025 (record not found) → 404 Not Found
- Services throw domain errors (subclasses of `Error`). Routes translate domain errors to HTTP errors.
- Add a global `setErrorHandler` plugin that logs unexpected errors and returns a generic 500.
- Never expose stack traces in production (`NODE_ENV=production`).

---

## Authentication

- Access tokens: JWT HS256, 15-minute expiry, payload `{ sub: userId, username }`.
- Refresh tokens: 32-byte crypto-random, SHA-256 hashed before storage, 7-day expiry, delivered as `httpOnly; SameSite=Strict; Secure` cookie.
- PATs: 32-byte crypto-random via `crypto.getRandomValues`, bcrypt cost 12, stored as hash.
- Passwords: bcrypt cost 12. Never compare in constant-non-time; use `bcrypt.compare`.
- JWT secret from `JWT_SECRET` env var. Throw on startup if missing.
- Never log raw tokens, passwords, or JWT payloads.

---

## Environment Variables

All config comes from environment variables loaded via `dotenv` at startup. Required variables must be validated at application startup (fail-fast). Document every variable in `../../.env.example`.

Required minimum:
```
DATABASE_URL
JWT_SECRET
BCRYPT_COST          # default 12
REPOS_PATH           # absolute path to bare repos volume
KEYS_PATH            # absolute path to authorized_keys volume
PORT                 # default 4000
NODE_ENV             # development | production | test
```

---

## Database Access

- All DB access through the Prisma client singleton in `src/lib/db.ts`.
- Never create `new PrismaClient()` inside services; import from the singleton.
- Transactions must be used when two or more tables are mutated atomically (e.g., delete token + update user).
- Never `SELECT *`; always list the specific fields needed in Prisma's `select` or `include`.
- Do not return `password_hash` or `token_hash` fields from API responses. Explicitly exclude them in selects.

---

## Testing Requirements

Every endpoint must have tests before the corresponding task is marked complete.

### Test File Location

```text
tests/
├── unit/             # service-level tests, no HTTP
└── integration/      # full route tests via fastify.inject()
    ├── auth.test.ts
    ├── ssh-keys.test.ts
    ├── tokens.test.ts
    ├── repositories.test.ts
    └── git-auth.test.ts
```

### Minimum Coverage Per Endpoint

Each endpoint must have at minimum:

| Test Type         | Required Cases                                              |
|-------------------|-------------------------------------------------------------|
| Happy path        | Valid input returns expected status + response shape        |
| Auth failure      | Missing / invalid JWT returns 401                          |
| Validation error  | Missing required field returns 400 with error detail        |
| Not found         | Non-existent resource returns 404                          |
| Ownership check   | Accessing another user's resource returns 403 or 404        |
| Conflict (if applicable) | Duplicate entry returns 409                       |

### Test Hygiene

- Use a test-only Postgres database (`DATABASE_URL_TEST` env var).
- Each test file that touches the database must:
  - Run migrations before the test suite (`beforeAll`)
  - Truncate affected tables between tests (`afterEach`) using a fixture helper
  - Close the Prisma connection after the suite (`afterAll`)
- Never share state between test cases (each test creates its own fixtures).
- Use factory functions in `tests/fixtures/` to create test data — no inline object literals for entities.
- Snapshot tests are forbidden for responses that include IDs, timestamps, or tokens.
- Tests must not make real filesystem changes to `repos/` or `keys/` in unit tests. Mock `fs` operations.
- Integration tests for SSH key and repo creation may use a temp directory fixture.

### Running Tests

```bash
pnpm test         # run once
pnpm test:watch   # watch mode
pnpm test:cov     # with coverage
```

Coverage gate: **80% line coverage** minimum enforced in CI. No regressions allowed.

---

## File Hygiene

- `src/lib/` must only contain pure utilities with no Fastify or Prisma imports.
- `src/services/` must not import from `src/routes/` or `src/plugins/`.
- Maximum file length: 300 lines. Split if exceeded.
- Barrel `index.ts` files are allowed only at `src/routes/<domain>/index.ts` level.
- Avoid deep nesting; flatten conditionals with early returns.
- All async functions use `async/await`; no `.then()` chains.

---

## Linting and Formatting

- ESLint with `@typescript-eslint/recommended` + `eslint-plugin-import`.
- Prettier default config (`printWidth: 100`, `singleQuote: true`, `trailingComma: 'all'`).
- Both must pass with zero warnings before merge.

```bash
pnpm lint
pnpm format:check
```
