import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormGroup } from '@/components/ui/FormGroup';
import { Input } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { register as registerUser } from '@/api/auth';
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth';
import { useAuthStore } from '@/store/auth';
import type { ApiError } from '@/types/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const { register, handleSubmit, formState, setError } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterInput) =>
      registerUser({ username: values.username, email: values.email, password: values.password }),
    onSuccess: (data) => {
      setTokens(data.accessToken);
      setUser(data.user);
      navigate('/dashboard', { replace: true });
    },
    onError: (err: ApiError) => {
      if (err.status === 409 && err.field === 'username') {
        setError('username', { message: 'This username is already taken' });
      } else if (err.status === 409 && err.field === 'email') {
        setError('email', { message: 'This email is already registered' });
      } else {
        setError('root', { message: err.message ?? 'Registration failed. Please try again.' });
      }
    },
  });

  const onSubmit = (values: RegisterInput) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            Create your account
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Start managing repositories from one place
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Register once, then add SSH keys and personal access tokens as needed.
          </p>
        </div>

        <Card className="border-gray-200 shadow-sm dark:border-gray-800">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormGroup label="Username" required htmlFor="username">
                <Input
                  id="username"
                  aria-label="Username"
                  autoComplete="username"
                  error={formState.errors.username?.message}
                  {...register('username')}
                />
              </FormGroup>

              <FormGroup label="Email" required htmlFor="email">
                <Input
                  id="email"
                  aria-label="Email"
                  type="email"
                  autoComplete="email"
                  error={formState.errors.email?.message}
                  {...register('email')}
                />
              </FormGroup>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormGroup label="Password" required htmlFor="password">
                <Input
                  id="password"
                  aria-label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={formState.errors.password?.message}
                  {...register('password')}
                />
              </FormGroup>

              <FormGroup label="Confirm password" required htmlFor="confirmPassword">
                <Input
                  id="confirmPassword"
                  aria-label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  error={formState.errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </FormGroup>
            </div>

            {formState.errors.root ? (
              <Alert
                variant="error"
                message={formState.errors.root.message ?? 'Registration failed.'}
              />
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
