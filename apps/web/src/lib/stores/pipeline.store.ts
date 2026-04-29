import { create } from 'zustand';
import type { PipelineRun, PipelineStage, StageStatus } from '@repo/shared-types';

interface PipelineState {
  runs: Record<string, PipelineRun & { stages: PipelineStage[] }>;
  activeRunId: string | null;
  setRun: (run: PipelineRun & { stages: PipelineStage[] }) => void;
  updateStage: (runId: string, stageId: string, patch: Partial<PipelineStage>) => void;
  setActiveRun: (runId: string | null) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  runs: {},
  activeRunId: null,

  setRun: (run) =>
    set((state) => ({ runs: { ...state.runs, [run.id]: run } })),

  updateStage: (runId, stageId, patch) =>
    set((state) => {
      const run = state.runs[runId];
      if (!run) return state;
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...run,
            stages: run.stages.map((s) =>
              s.id === stageId ? { ...s, ...patch } : s,
            ),
          },
        },
      };
    }),

  setActiveRun: (runId) => set({ activeRunId: runId }),
}));
