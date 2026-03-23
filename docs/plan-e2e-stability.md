# Plan: Playwright E2E Stability and Scalability

## Objective

Stabilize Playwright E2E runs against the docker-compose deployment by removing auth rate-limit flakiness, fixing inaccurate element targeting, and enforcing independent test behavior so the suite remains reliable as it grows.

## Scope

In scope:

- Backend auth rate-limit control for E2E in compose-based runs
- Correct HTTP semantics for rate-limit responses
- Fixing inaccurate Playwright selectors and assertions
- Test independence improvements (no shared identities, per-test setup)
- Reusable E2E helper utilities for scalable maintenance
- Documentation updates for running and maintaining E2E

Out of scope for this pass:

- Broad expansion of new E2E feature coverage (SSH keys/PAT deep scenarios)
- Full database reset between every E2E test (prefer independent data + targeted cleanup first)

## Implementation Phases

### Phase A: Backend rate-limit reliability

1. Add explicit environment variable support to disable auth rate limiting during E2E runs.
2. Keep secure defaults so production behavior remains protected.
3. Prevent accidental disablement in production via startup validation.
4. Ensure rate-limit responses use proper status semantics instead of surfacing as generic internal server errors.

Primary files:

- `apps/backend/src/lib/env.ts`
- `apps/backend/src/routes/auth/index.ts`
- `.env.example`
- `docker-compose.yml`

### Phase B: Immediate E2E bug fixes

1. Correct stale Playwright selectors in repository/login flows.
2. Align text expectations with actual frontend labels and buttons.
3. Re-run failing specs individually to verify each fix in isolation.

Primary files:

- `apps/frontend/tests/e2e/repositories.spec.ts`
- `apps/frontend/tests/e2e/auth.spec.ts`
- `apps/frontend/src/pages/LoginPage.tsx`
- `apps/frontend/src/pages/RegisterPage.tsx`

### Phase C: Test independence hardening

1. Remove shared file-level user identity assumptions.
2. Generate unique user/repo data per test case.
3. Ensure each test arranges its own prerequisites.
4. Add targeted cleanup where resource leakage is likely.

Primary files:

- `apps/frontend/tests/e2e/auth.spec.ts`
- `apps/frontend/tests/e2e/repositories.spec.ts`

### Phase D: Scalable test architecture

1. Introduce reusable Playwright helper utilities for repeated auth/repository setup flows.
2. Centralize data generation for readability and consistency.
3. Keep selectors semantic-first and stable.

Primary files:

- `apps/frontend/tests/e2e/utils.ts` (new)
- `apps/frontend/tests/e2e/auth.spec.ts`
- `apps/frontend/tests/e2e/repositories.spec.ts`

### Phase E: Verification

1. Run targeted spec checks for previously failing suites.
2. Run full Playwright suite in parallel.
3. Verify backend behavior with and without rate-limit disablement.
4. Confirm no regression in secure default behavior.

## Validation Commands

- `pnpm --filter @custom-git-server/frontend exec playwright test tests/e2e/auth.spec.ts --project=chromium --workers=1`
- `pnpm --filter @custom-git-server/frontend exec playwright test tests/e2e/repositories.spec.ts --project=chromium --workers=1`
- `pnpm --filter @custom-git-server/frontend test:e2e`

## Risks and Mitigations

- Risk: accidental disablement of rate limiting in production.
  - Mitigation: guard rails in backend env validation and safe defaults in `.env.example`.

- Risk: selector churn from UI text changes.
  - Mitigation: use stable semantic selectors and centralize test helpers.

- Risk: persistent compose DB state affecting repeatability.
  - Mitigation: enforce per-test uniqueness and test-local setup/cleanup strategy.
