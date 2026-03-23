import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { deleteRepository, getRepository } from '@/api/repositories';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';

export function RepositoryDetail({ owner, name }: { owner: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const {
    data: repo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.repositories.byName(name),
    queryFn: () => getRepository(owner, name),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRepository(owner, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.list });
      navigate('/dashboard', { replace: true });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
        Loading repository details...
      </Card>
    );
  }

  if (isError || !repo) {
    return (
      <Alert
        variant="error"
        message="Failed to load repository details or the repository does not exist."
      />
    );
  }

  const currentHost = window.location.host;
  const sshUrl = `ssh://git@${currentHost}:2222/git-repos/${owner}/${name}.git`;
  const httpsUrl = `${window.location.protocol}//${currentHost}/${owner}/${name}.git`;

  return (
    <section className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                {owner}/{name}
              </h2>
              <Badge variant={repo.isPrivate ? 'warning' : 'success'}>
                {repo.isPrivate ? 'Private' : 'Public'}
              </Badge>
            </div>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
              {repo.description || 'No repository description provided.'}
            </p>
          </div>

          {user?.username === owner ? (
            <Button variant="danger" onClick={() => setShowConfirmDelete(true)}>
              Delete repository
            </Button>
          ) : null}
        </div>

        <dl className="grid gap-4 border-t border-gray-200 pt-5 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">Visibility</dt>
            <dd className="mt-1">{repo.isPrivate ? 'Private' : 'Public'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">Created</dt>
            <dd className="mt-1">{new Date(repo.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">Owner</dt>
            <dd className="mt-1">{owner}</dd>
          </div>
        </dl>
      </Card>

      {deleteMutation.isError ? (
        <Alert variant="error" message="Failed to delete repository. Please try again." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">Clone via HTTPS</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use your username and a personal access token when prompted for credentials.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
            <code>git clone {httpsUrl}</code>
          </pre>
          <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
            HTTPS username:{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">{user?.username}</span>.
            Password: your generated personal access token.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">Clone via SSH</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use SSH if you have already added a public key to your account settings.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
            <code>git clone {sshUrl}</code>
          </pre>
          <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
            SSH operations require a matching public key in your configured SSH keys list.
          </p>
        </Card>
      </div>

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Delete repository"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowConfirmDelete(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              Delete repository
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            This will remove{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {owner}/{name}
            </span>{' '}
            from the platform and delete its bare repository from disk.
          </p>
          <p>This action cannot be undone.</p>
        </div>
      </Modal>
    </section>
  );
}
