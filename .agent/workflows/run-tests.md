---
description: How to run the full test suite and interpret results
---

# Workflow: Run Tests

## Prerequisites

Postgres must be running (for backend integration tests):

```bash
docker compose up postgres -d
```

## Run All Tests

```bash
pnpm test
```

This runs Turborepo's `test` pipeline across all workspaces — backend Vitest + frontend Vitest.

## Run Backend Tests Only

```bash
pnpm --filter @custom-git-server/backend test
```

Watch mode:

```bash
pnpm --filter @custom-git-server/backend test:watch
```

With coverage:

```bash
pnpm --filter @custom-git-server/backend test:cov
```

Coverage gate: **80% line coverage** minimum.

## Run Frontend Unit Tests Only

```bash
pnpm --filter @custom-git-server/frontend test
```

With coverage report:

```bash
pnpm --filter @custom-git-server/frontend test:cov
```

Coverage gate: **75% line coverage** minimum.

## Run Frontend E2E Tests (Playwright)

Requires the full compose stack running:

```bash
docker compose up -d --build
```

Then:

```bash
pnpm --filter @custom-git-server/frontend test:e2e
```

## Interpreting Results

| Result                              | Action                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| All tests pass                      | ✅ Mark phase tasks complete                                                                  |
| Test fails — missing implementation | Implement the missing code, then re-run                                                       |
| Test fails — test is wrong          | Fix the test to match the correct contract, do not change production code to pass wrong tests |
| Coverage below gate                 | Add missing test cases until gate is met                                                      |
| Type errors or lint warnings        | Fix before marking done                                                                       |

## After Any Test Failure

1. Read the full error output.
2. Identify whether the failure is in: unit test, integration test, or E2E test.
3. Check if the failure is a new regression (introduced by recent changes) or a pre-existing failure.
4. Fix root cause — do not suppress errors or skip tests without a documented reason.
5. Re-run the affected test suite.
