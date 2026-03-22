import { z } from 'zod'

export const createRepositorySchema = z.object({
  name: z
    .string()
    .min(1, 'Repository name is required')
    .max(100)
    .regex(/^[a-zA-Z0-9.\-_]+$/, 'Invalid name format'),
  description: z.string().optional().nullable(),
  isPrivate: z.boolean(),
})

export type CreateRepositoryFormValues = z.infer<typeof createRepositorySchema>
