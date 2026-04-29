export type RunStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type StageType = 'SCRIPT' | 'AUDIO' | 'VIDEO' | 'CAPTIONS' | 'EXPORT';

export type StageStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING';

export interface PipelineRun {
  id: string;
  ideaId: string;
  creatorId: string;
  status: RunStatus;
  createdAt: Date;
  updatedAt: Date;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  runId: string;
  stage: StageType;
  status: StageStatus;
  outputUrl?: string | null;
  outputData?: Record<string, unknown> | null;
  errorMsg?: string | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptOutput {
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
}

export interface PipelineRunWithIdea extends PipelineRun {
  idea: {
    id: string;
    title: string;
    description?: string | null;
  };
}
