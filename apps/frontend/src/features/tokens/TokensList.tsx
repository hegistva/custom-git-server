import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokensApi } from '../../api/tokens';
import { queryKeys } from '../../lib/queryKeys';
import type { Token } from '../../types/tokens';

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

  if (isLoading) return <p>Loading tokens...</p>;
  if (isError) return <p>Error loading tokens.</p>;
  if (!tokens || tokens.length === 0) return <p>No tokens generated.</p>;

  return (
    <section>
      <h2>Your Personal Access Tokens</h2>
      <ul>
        {tokens.map((token: Token) => (
          <li
            key={token.id}
            style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}
          >
            <div>
              <strong>{token.label}</strong>
              <p>Prefix: {token.tokenPrefix}</p>
              <p>Created: {new Date(token.createdAt).toLocaleString()}</p>
              {token.revokedAt ? (
                <p style={{ color: 'red' }}>
                  Revoked: {new Date(token.revokedAt).toLocaleString()}
                </p>
              ) : (
                <p style={{ color: 'green' }}>Active</p>
              )}
            </div>
            {!token.revokedAt && (
              <button
                onClick={() => revokeMutation.mutate(token.id)}
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
