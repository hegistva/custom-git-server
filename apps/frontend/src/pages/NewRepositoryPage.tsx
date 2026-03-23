import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';
import { CreateRepositoryForm } from '@/features/repositories/CreateRepositoryForm';

export default function NewRepositoryPage() {
  return (
    <div className="space-y-8 py-6">
      <Card className="space-y-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <Link to="/dashboard" className="text-sm font-medium">
          Back to dashboard
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Repository setup
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Create a new repository
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
            Define the repository name, visibility, and optional description before the bare Git
            repository is created on disk.
          </p>
        </div>
      </Card>

      <CreateRepositoryForm />
    </div>
  );
}
