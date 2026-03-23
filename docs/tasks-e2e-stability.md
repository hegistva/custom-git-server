# Tasks: Playwright E2E Stability and Scalability

Reference plan: [plan-e2e-stability.md](plan-e2e-stability.md)

## Phase A — Backend Rate-Limit Reliability

- [x] Add `DISABLE_AUTH_RATE_LIMIT` parsing in backend env configuration
- [x] Enforce production guard so rate-limit disable cannot be used in production
- [x] Use `DISABLE_AUTH_RATE_LIMIT` in auth route registration logic
- [x] Correct auth rate-limit response semantics (proper throttling status handling)
- [x] Add backend integration test coverage for rate-limit behavior (enabled vs disabled)
- [x] Document `DISABLE_AUTH_RATE_LIMIT` in `.env.example`
- [x] Wire `DISABLE_AUTH_RATE_LIMIT` in `docker-compose.yml` backend service

## Phase B — Immediate E2E Bug Fixes

- [x] Fix inaccurate login field selector usage in repository E2E test
- [x] Fix inaccurate login submit button selector usage in repository E2E test
- [x] Align route URL expectations in repository E2E test with current app behavior
- [x] Align auth E2E error expectations with current backend/frontend behavior
- [x] Run auth E2E spec in isolation and confirm pass
- [x] Run repository E2E spec in isolation and confirm pass

## Phase C — Test Independence Hardening

- [x] Remove shared file-level credentials in auth E2E tests
- [x] Generate unique user identities per auth test case
- [x] Ensure repository E2E test setup is fully test-local and deterministic
- [x] Add cleanup for created repositories at end of repository scenarios
- [x] Verify tests do not rely on execution order

## Phase D — Scalable E2E Structure

- [x] Add reusable E2E helper module for auth and repository setup flows
- [x] Refactor auth E2E tests to use helper utilities
- [x] Refactor repository E2E test to use helper utilities
- [x] Reduce duplicated setup code across E2E specs

## Phase E — Verification and Documentation

- [x] Run full frontend Playwright suite and confirm stable pass
- [x] Re-run suite to verify repeatability against persistent compose environment
- [x] Update `README.md` E2E section with rate-limit test toggle guidance
- [x] Mark completed tasks in this file
- [ ] If applicable, update related checklist items in `docs/tasks-fullstack.md`
