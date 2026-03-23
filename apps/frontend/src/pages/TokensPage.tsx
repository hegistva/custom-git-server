import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';
import { GenerateTokenForm } from '@/features/tokens/GenerateTokenForm';
import { TokensList } from '@/features/tokens/TokensList';

export default function TokensPage() {
  return (
    <div className="space-y-8 py-6">
      <Card className="space-y-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <Link to="/dashboard" className="text-sm font-medium">
          Back to dashboard
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            HTTPS credentials
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Personal access tokens
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
            Generate one-time tokens for Git and API access, then revoke them when they are no
            longer needed.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.15fr)]">
        <GenerateTokenForm />
        <TokensList />
      </div>
    </div>
  );
}
