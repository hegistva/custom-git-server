---
applyTo: 'apps/frontend/**'
---

# Frontend Development Instructions

Stack: **Node 20 + TypeScript (strict) + Vite + React 18 + TanStack Query + React Router v7**

---

## Project Structure

```text
apps/frontend/
├── src/
│   ├── api/              # API client functions, one file per domain
│   │   ├── auth.ts
│   │   ├── ssh-keys.ts
│   │   ├── tokens.ts
│   │   └── repositories.ts
│   ├── components/       # Shared reusable UI components
│   │   ├── ui/           # Generic: Button, Input, Modal, Badge, etc.
│   │   └── layout/       # AppShell, Navbar, Sidebar
│   ├── features/         # Feature-scoped components and hooks
│   │   ├── auth/
│   │   ├── ssh-keys/
│   │   ├── tokens/
│   │   └── repositories/
│   ├── pages/            # Route-level page components (thin, compose features)
│   ├── hooks/            # Generic custom hooks (useDebounce, useClipboard, etc.)
│   ├── lib/              # Utilities: api client config, zod schemas, helpers
│   ├── store/            # Zustand stores (auth only)
│   └── types/            # Shared TypeScript interfaces matching API responses
├── tests/
│   ├── unit/             # Component and hook tests (Vitest + Testing Library)
│   └── e2e/              # Playwright E2E tests
├── public/
├── index.html
├── vite.config.ts
├── playwright.config.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## TypeScript Rules

- `"strict": true` is mandatory. No `any` without an inline justification comment.
- All API response shapes must be typed in `src/types/`. Never use `any` or `unknown` for parsed API responses.
- Use Zod for **all** form input validation. Define schemas in `src/lib/schemas/<domain>.ts`.
- Infer form types from Zod schemas with `z.infer<typeof Schema>`.
- Never pass raw form values to API calls without parsing through the Zod schema first.
- Prefer `interface` over `type` for object shapes; use `type` for unions, intersections, and aliases.

---

## React Conventions

- **No class components.** All components are function components.
- **No default exports from barrel files.** Use named exports everywhere except page components (which can have default exports for code splitting).
- Every page-level component is lazy-loaded with `React.lazy`.
- Co-locate component styles in the same directory as the component (CSS modules preferred).
- Avoid prop drilling beyond two levels; use context or Zustand for shared state.
- Never mutate state directly. Always use setter functions or store methods.
- Avoid `useEffect` for data fetching; use TanStack Query instead.
- `useEffect` is permitted for: DOM subscriptions, non-query event listeners, and setting document title.

---

## API Client

- All API calls go through the single Axios or `ky` instance configured in `src/lib/api.ts`.
- The instance must:
  - Set `Authorization: Bearer <token>` from Zustand auth store
  - Intercept 401 responses, attempt silent refresh, and retry once
  - Throw a typed `ApiError` with `status`, `message`, and optional `field` on non-2xx responses
- Never call `fetch()` directly in components or hooks. Always import from `src/api/`.
- API functions return typed data (inferred from response type definitions), never raw `Response` objects.

---

## State Management

### Auth State (Zustand)

```text
src/store/auth.ts
  - accessToken: string | null
  - user: { id, username, email } | null
  - setTokens(accessToken: string): void
  - clearAuth(): void
```

- Access token lives **in memory only** (Zustand store). Never `localStorage` for tokens.
- On page reload, attempt silent refresh via `/api/auth/refresh` (uses httpOnly cookie) before rendering protected routes.

### Server State (TanStack Query)

- All server data (repos, SSH keys, tokens) managed by TanStack Query.
- Query keys are centralized in `src/lib/queryKeys.ts` as a typed object.
- Mutations must call `queryClient.invalidateQueries` for relevant keys on success.
- Stale time: 60 seconds default. Override only where necessary with a comment.

---

## Routing

- Route definitions are in `src/pages/routes.tsx`.
- Auth-required routes wrapped in `<ProtectedRoute>` which redirects to `/login` on missing auth.
- Public routes (login, register) redirect to `/dashboard` if already authenticated.
- Use `React.lazy` + `Suspense` for all page components.

---

## Forms

- Every form uses `react-hook-form` with a `zodResolver`.
- Every field has `aria-label` or `label` with correct `htmlFor`/`id` pairing.
- Show inline validation errors below each field (not just a top-level toast).
- Disable submit button while the mutation is in flight (`isPending`).
- On success, reset form state unless the UX requires otherwise.

---

## Environment Variables

All Vite env vars must start with `VITE_`. Document in `../../.env.example`.

Required:

```
VITE_API_BASE_URL    # e.g. https://localhost/api
```

Never embed secrets in frontend env vars.

---

## Testing Requirements

### Unit Tests (Vitest + Testing Library)

File location: `tests/unit/<feature>/`

#### Every page component must have:

- A smoke test: renders without throwing
- A visible content test: key headings or labels are present
- Form validation test (if the page contains a form): invalid inputs show errors

#### Every form component must have:

| Test                        | Required                                                   |
| --------------------------- | ---------------------------------------------------------- |
| Renders all fields          | All expected inputs are in the document                    |
| Validation — missing fields | Submit with empty form triggers field-level error messages |
| Validation — invalid format | Wrong-format inputs show the Zod error message             |
| Happy path submit           | Valid form calls the mocked mutation function              |
| Loading state               | Submit button is disabled while mutation is pending        |

#### Custom hooks must have:

- Unit test for each distinct state the hook manages
- Test using `renderHook` from `@testing-library/react`

### E2E Tests (Playwright)

File location: `tests/e2e/`

#### Required E2E scenarios (minimum):

| Scenario                     | File                   |
| ---------------------------- | ---------------------- |
| Register new user            | `auth.spec.ts`         |
| Login with valid credentials | `auth.spec.ts`         |
| Login failure (wrong pass)   | `auth.spec.ts`         |
| Add SSH key                  | `ssh-keys.spec.ts`     |
| Generate and copy PAT        | `tokens.spec.ts`       |
| Create repository            | `repositories.spec.ts` |
| View repository clone URLs   | `repositories.spec.ts` |
| Logged-out user redirected   | `auth.spec.ts`         |

#### Playwright Conventions

- Use `page.getByRole`, `page.getByLabel`, `page.getByTestId` — avoid CSS selector queries.
- Add `data-testid` attributes to interactive elements that cannot be reached by role/label.
- Each spec file handles its own user fixture: register + login in `beforeEach` via API (not UI) to keep test speed high.
- Never rely on test execution order; each test is fully independent.
- Screenshot on failure is enabled by default in `playwright.config.ts`.

### Testing Hygiene

```bash
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright (requires running compose stack)
pnpm test:cov      # Unit test coverage report
```

Coverage gate: **75% line coverage** for `src/` in unit tests. E2E is not counted in the coverage gate.

---

## Accessibility

- All interactive elements are keyboard-reachable.
- Focus is managed correctly when modals open/close.
- Color is never the sole indicator of state (use icons or text as well).
- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<header>`, `<section>` over generic `<div>`.

---

## Linting and Formatting

- ESLint with `@typescript-eslint/recommended`, `eslint-plugin-react`, `eslint-plugin-jsx-a11y`.
- Prettier same config as backend (`printWidth: 100`, `singleQuote: true`, `trailingComma: 'all'`).

```bash
pnpm lint
pnpm format:check
```

Zero warnings policy. Both must pass before merge.
