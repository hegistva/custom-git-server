import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { tokensApi } from '@/api/tokens';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormGroup } from '@/components/ui/FormGroup';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { queryKeys } from '@/lib/queryKeys';
import { generateTokenSchema, type GenerateTokenFormData } from '@/lib/schemas/tokens';

export function GenerateTokenForm() {
  const queryClient = useQueryClient();
  const [newRawToken, setNewRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCopied(false);
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.list });
    },
  });

  const onSubmit = (data: GenerateTokenFormData) => {
    generateMutation.mutate(data);
  };

  const copyToken = async () => {
    if (!newRawToken) {
      return;
    }

    await navigator.clipboard.writeText(newRawToken);
    setCopied(true);
  };

  return (
    <section>
      <Card className="space-y-5 xl:sticky xl:top-24">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Generate a token</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The raw token value is shown once. Store it immediately in your password manager or
            secure notes.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormGroup label="Token label" required htmlFor="label">
            <Input
              id="label"
              placeholder="e.g. CI deploy token"
              error={errors.label?.message}
              disabled={generateMutation.isPending}
              {...register('label')}
            />
          </FormGroup>

          {generateMutation.isError ? (
            <Alert variant="error" message="Failed to generate token." />
          ) : null}

          <Button type="submit" className="w-full" loading={generateMutation.isPending}>
            Generate token
          </Button>
        </form>
      </Card>

      <Modal
        isOpen={Boolean(newRawToken)}
        onClose={() => setNewRawToken(null)}
        title="Token generated"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewRawToken(null)}>
              I have copied it
            </Button>
            <Button onClick={() => void copyToken()}>{copied ? 'Copied' : 'Copy token'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="warning"
            message="This raw token value will not be shown again after you close this dialog."
          />
          <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
            <code>{newRawToken}</code>
          </pre>
        </div>
      </Modal>
    </section>
  );
}
