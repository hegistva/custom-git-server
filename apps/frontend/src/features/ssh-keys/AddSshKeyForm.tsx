import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sshKeysApi } from '../../api/ssh-keys';
import { addSshKeySchema, type AddSshKeyFormData } from '../../lib/schemas/ssh-keys';
import { queryKeys } from '../../lib/queryKeys';
import type { ApiError } from '../../types/api';

export function AddSshKeyForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState, setError, reset } = useForm<AddSshKeyFormData>({
    resolver: zodResolver(addSshKeySchema),
  });

  const mutation = useMutation({
    mutationFn: (values: AddSshKeyFormData) => sshKeysApi.add(values),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.sshKeys.list });
    },
    onError: (err: ApiError) => {
      if (err.status === 409) {
        setError('publicKey', { message: 'An SSH key with this fingerprint already exists.' });
      } else {
        setError('root', { message: err.message ?? 'Failed to add SSH key.' });
      }
    },
  });

  const onSubmit = (values: AddSshKeyFormData) => {
    mutation.mutate(values);
  };

  return (
    <section>
      <h2>Add New SSH Key</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="label">Title / Label</label>
          <input id="label" type="text" placeholder="e.g. Work Laptop" {...register('label')} />
          {formState.errors.label && <p role="alert">{formState.errors.label.message}</p>}
        </div>

        <div>
          <label htmlFor="publicKey">Key</label>
          <textarea
            id="publicKey"
            placeholder="ssh-ed25519 AAAAC3... user@host"
            rows={4}
            {...register('publicKey')}
          />
          {formState.errors.publicKey && <p role="alert">{formState.errors.publicKey.message}</p>}
        </div>

        {formState.errors.root && <p role="alert">{formState.errors.root.message}</p>}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Adding...' : 'Add Key'}
        </button>
      </form>
    </section>
  );
}
