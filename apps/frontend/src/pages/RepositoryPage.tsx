import { useParams } from 'react-router-dom';

import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';
import { RepositoryDetail } from '@/features/repositories/RepositoryDetail';
import { useAuthStore } from '@/store/auth';

export default function RepositoryPage() {
  const { name } = useParams<{ name: string }>();
  // Assuming the owner is the current user since it's MVP
  const user = useAuthStore((state) => state.user);

  if (!name || !user) {
    return <p className="py-10 text-sm text-red-700 dark:text-red-300">Invalid repository.</p>;
  }

  return (
    <div className="space-y-6 py-6">
      <Card className="space-y-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <Link to="/dashboard" className="text-sm font-medium">
          Back to dashboard
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Repository detail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            {user.username}/{name}
          </h1>
        </div>
      </Card>
      <RepositoryDetail owner={user.username} name={name} />
    </div>
  );
}
