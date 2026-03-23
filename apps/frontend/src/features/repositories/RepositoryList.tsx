import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { listRepositories } from '@/api/repositories';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';
import { queryKeys } from '@/lib/queryKeys';

export function RepositoryList() {
  const navigate = useNavigate();
  const {
    data: repos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.repositories.list,
    queryFn: listRepositories,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-4 animate-pulse">
            <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900" />
            <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-900" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return <Alert variant="error" message="Failed to load repositories." />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-950 dark:text-white">Your repositories</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {repos?.length ?? 0} repository{repos?.length === 1 ? '' : 'ies'} available.
          </p>
        </div>
        <Button onClick={() => navigate('/repositories/new')}>New repository</Button>
      </div>

      {!repos || repos.length === 0 ? (
        <Card className="space-y-3 border-dashed text-center">
          <h4 className="text-lg font-semibold text-gray-950 dark:text-white">
            No repositories yet
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Create your first repository to start pushing code over SSH or HTTPS.
          </p>
          <div>
            <Button onClick={() => navigate('/repositories/new')}>Create repository</Button>
          </div>
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {repos.map((repo) => (
            <li key={repo.id}>
              <Card interactive className="flex h-full flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold text-gray-950 dark:text-white">
                        <Link to={`/repositories/${repo.name}`} className="font-semibold">
                          {repo.name}
                        </Link>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {repo.description || 'No description provided.'}
                      </p>
                    </div>
                    <Badge variant={repo.isPrivate ? 'warning' : 'success'}>
                      {repo.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <span>Created {new Date(repo.createdAt).toLocaleDateString()}</span>
                  <Link to={`/repositories/${repo.name}`} className="font-medium">
                    Open repository
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
