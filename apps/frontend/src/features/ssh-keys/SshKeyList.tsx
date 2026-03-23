import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sshKeysApi } from '@/api/ssh-keys';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { queryKeys } from '@/lib/queryKeys';
import type { SshKey } from '@/types/ssh-keys';

export function SshKeyList() {
  const queryClient = useQueryClient();
  const {
    data: keys,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.sshKeys.list,
    queryFn: sshKeysApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sshKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sshKeys.list });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
        Loading SSH keys...
      </Card>
    );
  }

  if (isError) {
    return <Alert variant="error" message="Failed to load SSH keys." />;
  }

  if (!keys || keys.length === 0) {
    return (
      <Card className="space-y-3 border-dashed">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-white">Your SSH keys</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No SSH keys have been added yet. Add a public key to enable Git over SSH.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Your SSH keys</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Review fingerprints and revoke any key that should no longer access your repositories.
        </p>
      </div>
      <ul className="space-y-4">
        {keys.map((key: SshKey) => (
          <li key={key.id}>
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-950 dark:text-white">{key.label}</h3>
                <code className="inline-block rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                  {key.fingerprint}
                </code>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Added on {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(key.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
