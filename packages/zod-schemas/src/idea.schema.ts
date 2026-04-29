import { z } from 'zod';

export const IdeaStatusSchema = z.enum(['IDEA', 'IN_PROGRESS', 'POSTED']);

export const CreateIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  score: z.number().int().min(0).max(100).default(0),
  series: z.string().max(100).optional(),
  episode: z.number().int().positive().optional(),
  postDate: z.coerce.date().optional(),
});

export const UpdateIdeaSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  score: z.number().int().min(0).max(100).optional(),
  series: z.string().max(100).optional().nullable(),
  episode: z.number().int().positive().optional().nullable(),
  status: IdeaStatusSchema.optional(),
  postDate: z.coerce.date().optional().nullable(),
});

export type CreateIdeaInput = z.infer<typeof CreateIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof UpdateIdeaSchema>;
