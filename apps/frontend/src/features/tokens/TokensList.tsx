import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tokensApi } from '@/api/tokens';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { queryKeys } from '@/lib/queryKeys';
import type { Token } from '@/types/tokens';

export function TokensList() {
  const queryClient = useQueryClient();

  const {
    data: tokens,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.tokens.list,
    queryFn: tokensApi.list,
  });

  const revokeMutation = useMutation({
    mutationFn: tokensApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.list });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
        Loading tokens...
      </Card>
    );
  }

  if (isError) {
    return <Alert variant="error" message="Error loading tokens." />;
  }

  if (!tokens || tokens.length === 0) {
    return (
      <Card className="space-y-3 border-dashed">
        <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Your tokens</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No personal access tokens have been generated yet.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
          Your personal access tokens
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Tokens are shown by prefix only. Raw token values are displayed once at creation time.
        </p>
      </div>
      <ul className="space-y-4">
        {tokens.map((token: Token) => (
          <li key={token.id}>
            <Card className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
                      {token.label}
                    </h3>
                    <Badge variant={token.revokedAt ? 'danger' : 'success'}>
                      {token.revokedAt ? 'Revoked' : 'Active'}
                    </Badge>
                  </div>
                  <code className="inline-block rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                    Prefix: {token.tokenPrefix}
                  </code>
                  <div className="grid gap-2 text-sm text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                    <p>Created: {new Date(token.createdAt).toLocaleString()}</p>
                    <p>
                      Last used:{' '}
                      {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : 'Never'}
                    </p>
                    <p>
                      Expires:{' '}
                      {token.expiresAt ? new Date(token.expiresAt).toLocaleString() : 'No expiry'}
                    </p>
                    <p>
                      Revoked:{' '}
                      {token.revokedAt ? new Date(token.revokedAt).toLocaleString() : 'Not revoked'}
                    </p>
                  </div>
                </div>

                {!token.revokedAt ? (
                  <Button
                    variant="danger"
                    onClick={() => revokeMutation.mutate(token.id)}
                    disabled={revokeMutation.isPending}
                  >
                    {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                  </Button>
                ) : null}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
