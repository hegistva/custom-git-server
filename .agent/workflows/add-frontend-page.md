---
description: Step-by-step pattern for adding a new React page / feature to the frontend
---

# Workflow: Add a New Frontend Page

Follow this pattern when implementing a new page in `apps/frontend`.

## Step 1 — Read Instructions

Read `.github/instructions/frontend.instructions.md` before writing any code.

## Step 2 — Define API Types

Add response types to `apps/frontend/src/types/<domain>.ts`:

```typescript
// src/types/example.ts
export interface Example {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}
```

Rules:
- Types must match the actual API response shape exactly.
- Never use `any` or `unknown` for parsed API responses.
- Use `interface` for object shapes, `type` for unions/aliases.

## Step 3 — Add Zod Schemas (for forms)

Add form input schemas to `apps/frontend/src/lib/schemas/<domain>.ts`:

```typescript
// src/lib/schemas/example.ts
import { z } from 'zod';

export const createExampleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
```

## Step 4 — Add API Client Function

Add to `apps/frontend/src/api/<domain>.ts`:

```typescript
// src/api/example.ts
import { api } from '../lib/api.js';
import type { Example } from '../types/example.js';
import type { CreateExampleInput } from '../lib/schemas/example.js';

export async function listExamples(): Promise<Example[]> {
  return api.get('examples').json();
}

export async function createExample(data: CreateExampleInput): Promise<Example> {
  return api.post('examples', { json: data }).json();
}
```

## Step 5 — Add Query Keys

Add to `apps/frontend/src/lib/queryKeys.ts`:

```typescript
export const queryKeys = {
  // ... existing keys
  examples: {
    all: ['examples'] as const,
    detail: (id: string) => ['examples', id] as const,
  },
};
```

## Step 6 — Build Feature Components

In `apps/frontend/src/features/<domain>/`:

```typescript
// src/features/example/ExampleList.tsx
import { useQuery } from '@tanstack/react-query';
import { listExamples } from '../../api/example.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function ExampleList() {
  const { data: examples, isPending } = useQuery({
    queryKey: queryKeys.examples.all,
    queryFn: listExamples,
    staleTime: 60_000,
  });

  if (isPending) return <div>Loading...</div>;

  return (
    <ul>
      {examples?.map((ex) => (
        <li key={ex.id}>{ex.name}</li>
      ))}
    </ul>
  );
}
```

Rules:
- Use TanStack Query for all server data — never `useEffect` for fetching.
- Mutations must call `queryClient.invalidateQueries` on success.
- Use shadcn/ui components (Button, Input, Card, etc.) from `src/components/ui/`.
- Install new shadcn components: `pnpm --filter @custom-git-server/frontend dlx shadcn@latest add <component>`

## Step 7 — Build Page Component

In `apps/frontend/src/pages/<PageName>.tsx`:

```typescript
// src/pages/ExamplePage.tsx
import { ExampleList } from '../features/example/ExampleList.js';
import { CreateExampleForm } from '../features/example/CreateExampleForm.js';

export default function ExamplePage() {
  return (
    <main>
      <h1>Examples</h1>
      <CreateExampleForm />
      <ExampleList />
    </main>
  );
}
```

Rules:
- Page components are the only files that can have default exports.
- Every page-level component is lazy-loaded via `React.lazy`.
- Pages are thin — they compose features, not implement them.

## Step 8 — Register the Route

In `apps/frontend/src/pages/routes.tsx`:

```typescript
const ExamplePage = React.lazy(() => import('./ExamplePage.js'));

// Inside router config:
{ path: '/examples', element: <ProtectedRoute><ExamplePage /></ProtectedRoute> }
```

## Step 9 — Write Tests

In `apps/frontend/tests/unit/<domain>/`:

Required for every page component:
- Smoke test (renders without throwing)
- Visible content test (key headings/labels present)
- Form validation test (invalid inputs show errors)

Required for every form component:
- All fields render
- Validation on empty submit
- Loading state disables submit
- Happy path calls mutation

```bash
pnpm --filter @custom-git-server/frontend test
pnpm --filter @custom-git-server/frontend typecheck
pnpm --filter @custom-git-server/frontend lint
```

All must pass with zero errors.

## Step 10 — Update tasks.md

Mark the completed task `[x]` in `docs/tasks-fullstack.md`.
