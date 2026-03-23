import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormGroup } from '@/components/ui/FormGroup';
import { Input } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { login } from '@/api/auth';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { useAuthStore } from '@/store/auth';
import type { ApiError } from '@/types/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const { register, handleSubmit, formState, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: LoginInput) => login(values.username, values.password),
    onSuccess: (data) => {
      setTokens(data.accessToken);
      setUser(data.user);
      navigate(from, { replace: true });
    },
    onError: (err: ApiError) => {
      if (err.status === 401) {
        setError('root', { message: 'Invalid username or password' });
      } else {
        setError('root', { message: err.message ?? 'Login failed. Please try again.' });
      }
    },
  });

  const onSubmit = (values: LoginInput) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Continue to your repositories, SSH keys, and access tokens.
          </p>
        </div>

        <Card className="border-gray-200 shadow-sm dark:border-gray-800">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormGroup label="Username" required htmlFor="username">
              <Input
                id="username"
                aria-label="Username"
                autoComplete="username"
                error={formState.errors.username?.message}
                {...register('username')}
              />
            </FormGroup>

            <FormGroup label="Password" required htmlFor="password">
              <Input
                id="password"
                aria-label="Password"
                type="password"
                autoComplete="current-password"
                error={formState.errors.password?.message}
                {...register('password')}
              />
            </FormGroup>

            {formState.errors.root ? (
              <Alert variant="error" message={formState.errors.root.message ?? 'Login failed.'} />
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
