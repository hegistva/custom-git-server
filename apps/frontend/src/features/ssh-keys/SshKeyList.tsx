import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sshKeysApi } from '../../api/ssh-keys';
import { queryKeys } from '../../lib/queryKeys';
import type { SshKey } from '../../types/ssh-keys';

export function SshKeyList() {
  const queryClient = useQueryClient();
  const { data: keys, isLoading, isError } = useQuery({
    queryKey: queryKeys.sshKeys.list,
    queryFn: sshKeysApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sshKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sshKeys.list });
    },
  });

  if (isLoading) return <p>Loading SSH keys...</p>;
  if (isError) return <p role="alert">Failed to load SSH keys.</p>;
  if (!keys || keys.length === 0) return <p>No SSH keys found.</p>;

  return (
    <section>
      <h2>Your SSH Keys</h2>
      <ul>
        {keys.map((key: SshKey) => (
          <li key={key.id}>
            <div>
              <strong>{key.label}</strong>
              <br />
              <code>{key.fingerprint}</code>
              <br />
              <small>Added on {new Date(key.createdAt).toLocaleDateString()}</small>
            </div>
            <button
              onClick={() => deleteMutation.mutate(key.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
