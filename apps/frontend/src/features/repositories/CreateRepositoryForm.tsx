import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createRepository } from '../../api/repositories';
import { queryKeys } from '../../lib/queryKeys';
import {
  createRepositorySchema,
  type CreateRepositoryFormValues,
} from '../../lib/schemas/repositories';
import { useAuthStore } from '../../store/auth';

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
      description: '',
      isPrivate: true,
    },
  });

  const mutation = useMutation({
    mutationFn: createRepository,
    onSuccess: (repo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.list });
      navigate(`/repositories/${repo.name}`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || error.message || 'Failed to create repository',
      });
    },
  });

  const onSubmit = (data: CreateRepositoryFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '400px' }}>
      {errors.root && (
        <div role="alert" style={{ color: 'red', marginBottom: '1rem' }}>
          {errors.root.message}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <p>
          Owner: <strong>{user?.username}</strong>
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Repository name *
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={mutation.isPending}
        />
        {errors.name && <p style={{ color: 'red', fontSize: '0.85rem' }}>{errors.name.message}</p>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={mutation.isPending}
        />
        {errors.description && (
          <p style={{ color: 'red', fontSize: '0.85rem' }}>{errors.description.message}</p>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" {...register('isPrivate')} disabled={mutation.isPending} />
          Private repository
        </label>
        {errors.isPrivate && (
          <p style={{ color: 'red', fontSize: '0.85rem' }}>{errors.isPrivate.message}</p>
        )}
      </div>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create repository'}
      </button>
    </form>
  );
}
