import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';
import { AddSshKeyForm } from '@/features/ssh-keys/AddSshKeyForm';
import { SshKeyList } from '@/features/ssh-keys/SshKeyList';

export default function SshKeysPage() {
  return (
    <div className="space-y-8 py-6">
      <Card className="space-y-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <Link to="/dashboard" className="text-sm font-medium">
          Back to dashboard
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            SSH access
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Manage SSH keys
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
            Add public keys for Git over SSH and revoke keys that should no longer have access.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <SshKeyList />
        <AddSshKeyForm />
      </div>
    </div>
  );
}
