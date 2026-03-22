import { z } from 'zod';

export const addSshKeySchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
  publicKey: z
    .string()
    .min(10, 'Public key is required')
    .max(2000, 'Public key too long')
    .regex(/^(ssh-|ecdsa-)/, 'Must be a valid SSH public key starting with ssh- or ecdsa-'),
});

export type AddSshKeyFormData = z.infer<typeof addSshKeySchema>;
