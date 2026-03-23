import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { createRepository } from '@/api/repositories';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormGroup } from '@/components/ui/FormGroup';
import { Input } from '@/components/ui/Input';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiError } from '@/types/api';
import {
  createRepositorySchema,
  type CreateRepositoryFormValues,
} from '@/lib/schemas/repositories';
import { useAuthStore } from '@/store/auth';

export function CreateRepositoryForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateRepositoryFormValues>({
    resolver: zodResolver(createRepositorySchema),
    defaultValues: {
      name: '',
      description: undefined,
      isPrivate: true,
    },
  });

  const mutation = useMutation({
    mutationFn: createRepository,
    onSuccess: (repo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.list });
      navigate(`/repositories/${repo.name}`);
    },
    onError: (error: ApiError) => {
      setError('root', {
        type: 'server',
        message: error.message || 'Failed to create repository',
      });
    },
  });

  const onSubmit = (data: CreateRepositoryFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Repository owner
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
            {user?.username}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          New repositories will be created under /{user?.username}/&lt;name&gt;.git.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root ? (
          <Alert variant="error" message={errors.root.message ?? 'Failed to create repository.'} />
        ) : null}

        <FormGroup label="Repository name" required htmlFor="name">
          <Input
            id="name"
            disabled={mutation.isPending}
            error={errors.name?.message}
            {...register('name')}
          />
        </FormGroup>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors duration-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-500"
            disabled={mutation.isPending}
            {...register('description')}
          />
          {errors.description ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.description.message}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Optional context shown on the repository detail page.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={mutation.isPending}
              {...register('isPrivate')}
            />
            <span className="space-y-1 text-sm">
              <span className="block font-medium text-gray-900 dark:text-gray-100">
                Private repository
              </span>
              <span className="block text-gray-600 dark:text-gray-300">
                Keep repository visibility restricted to the owner for the current MVP scope.
              </span>
            </span>
          </label>
          {errors.isPrivate ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.isPrivate.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create repository
          </Button>
        </div>
      </form>
    </Card>
  );
}
