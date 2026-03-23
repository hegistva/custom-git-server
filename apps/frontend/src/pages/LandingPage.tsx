import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/components/ui/Link';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-20 py-10 sm:py-14">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-100 px-6 py-12 shadow-sm dark:border-blue-900/50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40 sm:px-10 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
              Self-hosted Git platform
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl lg:text-6xl">
                Clean repository management for teams that want control without clutter.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-gray-700 dark:text-gray-300">
                Create repositories, manage SSH keys, and issue personal access tokens from one
                high-contrast interface designed for fast daily use.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/register')}>
                Get started
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          </div>

          <Card className="border-blue-200/70 bg-white/90 p-6 backdrop-blur dark:border-blue-900/70 dark:bg-gray-950/80">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Platform snapshot
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
                  Built around SSH, PATs, and repository ownership.
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  Secure HTTPS Git with personal access tokens
                </li>
                <li className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  SSH public key management with immediate revocation
                </li>
                <li className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  Repository creation, deletion, and clone instructions in one place
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            Why it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Everything important stays visible. Everything secondary gets out of the way.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
              Repository overview
            </h3>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
              Review your repositories, privacy state, and clone endpoints without hunting through
              nested views.
            </p>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
              Practical credentials
            </h3>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
              Manage SSH keys and PATs with focused screens built for operational tasks, not
              marketing chrome.
            </p>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
              Accessible by default
            </h3>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
              Strong contrast, visible focus states, and a consistent visual system across light and
              dark themes.
            </p>
          </Card>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-8 dark:border-gray-800 dark:bg-gray-900 sm:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
              Ready to work with your own Git server?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Register a user, upload an SSH key, and start creating repositories.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/register')}>Create account</Button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium no-underline hover:border-blue-300 hover:bg-white dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-950"
            >
              Already registered?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
