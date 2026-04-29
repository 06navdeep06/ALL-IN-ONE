import { z } from 'zod';

export const StageTypeSchema = z.enum([
  'SCRIPT',
  'AUDIO',
  'VIDEO',
  'CAPTIONS',
  'EXPORT',
]);

export const StageStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'RETRYING',
]);

export const RunStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
]);

export const StartPipelineSchema = z.object({
  ideaId: z.string().cuid(),
});

export const TriggerStageSchema = z.object({
  runId: z.string().cuid(),
  stage: StageTypeSchema,
  options: z.record(z.unknown()).optional(),
});

export type StageTypeInput = z.infer<typeof StageTypeSchema>;
export type StartPipelineInput = z.infer<typeof StartPipelineSchema>;
