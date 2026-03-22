import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateTokenSchema, type GenerateTokenFormData } from '../../lib/schemas/tokens';
import { tokensApi } from '../../api/tokens';
import { queryKeys } from '../../lib/queryKeys';

export function GenerateTokenForm() {
  const queryClient = useQueryClient();
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateTokenFormData>({
    resolver: zodResolver(generateTokenSchema),
  });

  const generateMutation = useMutation({
    mutationFn: tokensApi.generate,
    onSuccess: (data) => {
      setNewRawToken(data.rawToken);
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.list });
    },
  });

  const onSubmit = (data: GenerateTokenFormData) => {
    generateMutation.mutate(data);
  };

  return (
    <section>
      <h2>Generate New Token</h2>
      
      {newRawToken && (
        <div style={{ padding: '1rem', border: '2px solid green', marginBottom: '1rem' }}>
          <h3>Token Generated Successfully!</h3>
          <p>Make sure to copy your personal access token now. You won’t be able to see it again!</p>
          <code style={{ background: '#eee', padding: '0.5rem', display: 'block', margin: '0.5rem 0' }}>
            {newRawToken}
          </code>
          <button onClick={() => setNewRawToken(null)}>I have copied it</button>
        </div>
      )}

      {!newRawToken && (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
          <div>
            <label htmlFor="label">Token Note / Label:</label>
            <input id="label" {...register('label')} />
            {errors.label && <p style={{ color: 'red' }}>{errors.label.message}</p>}
          </div>

          {generateMutation.isError && (
            <p style={{ color: 'red' }}>Failed to generate token.</p>
          )}

          <button type="submit" disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating...' : 'Generate Token'}
          </button>
        </form>
      )}
    </section>
  );
}
