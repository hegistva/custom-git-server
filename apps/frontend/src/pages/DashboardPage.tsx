import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { listRepositories } from '@/api/repositories';
import { sshKeysApi } from '@/api/ssh-keys';
import { tokensApi } from '@/api/tokens';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { RepositoryList } from '@/features/repositories/RepositoryList';

const statCardBody = 'space-y-3';

export default function DashboardPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);

  const repositoriesQuery = useQuery({
    queryKey: ['dashboard', 'repositories'],
    queryFn: listRepositories,
  });

  const sshKeysQuery = useQuery({
    queryKey: ['dashboard', 'ssh-keys'],
    queryFn: sshKeysApi.list,
  });

  const tokensQuery = useQuery({
    queryKey: ['dashboard', 'tokens'],
    queryFn: tokensApi.list,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });

  const hasSummaryError = repositoriesQuery.isError || sshKeysQuery.isError || tokensQuery.isError;

  return (
    <div className="space-y-10 py-6">
      <section className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 px-6 py-8 dark:border-gray-800 dark:from-gray-950 dark:to-blue-950/30 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            Dashboard
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              Welcome back, {user?.username ?? 'there'}.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
              Manage your repositories, SSH keys, and personal access tokens from a single overview.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
        >
          Log out
        </Button>
      </section>

      {hasSummaryError ? (
        <Alert
          variant="warning"
          title="Summary unavailable"
          message="Some dashboard counts could not be loaded, but the feature pages remain available below."
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className={statCardBody}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Repositories
          </p>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">
            {repositoriesQuery.data?.length ?? '—'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Review existing repositories or create a new bare repository.
          </p>
          <Button onClick={() => navigate('/repositories/new')}>Create new repository</Button>
        </Card>

        <Card className={statCardBody}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            SSH keys
          </p>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">
            {sshKeysQuery.data?.length ?? '—'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add or revoke SSH public keys used for Git operations over SSH.
          </p>
          <Button variant="secondary" onClick={() => navigate('/settings/ssh-keys')}>
            Manage SSH keys
          </Button>
        </Card>

        <Card className={statCardBody}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Tokens
          </p>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">
            {tokensQuery.data?.filter((token) => !token.revokedAt).length ?? '—'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Generate and revoke personal access tokens for HTTPS Git and API use.
          </p>
          <Button variant="secondary" onClick={() => navigate('/settings/tokens')}>
            Manage tokens
          </Button>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Repositories</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Recent repositories, descriptions, and clone destinations.
          </p>
        </div>
        <RepositoryList />
      </section>
    </div>
  );
}
