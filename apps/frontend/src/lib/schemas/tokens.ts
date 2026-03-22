import { z } from 'zod';

export const generateTokenSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(50, 'Label must be 50 characters or less'),
});

export type GenerateTokenFormData = z.infer<typeof generateTokenSchema>;
