'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { usePipelineSocket } from '@/hooks/use-pipeline-socket';
import { StageCard } from '@/components/pipeline/stage-card';
import type { PipelineRun, PipelineStage, StageType } from '@repo/shared-types';

type RunWithStages = PipelineRun & { stages: PipelineStage[] };

const STAGE_ORDER: StageType[] = ['SCRIPT', 'AUDIO', 'VIDEO', 'CAPTIONS', 'EXPORT'];

function getNextStage(stages: PipelineStage[]): StageType | null {
  const completed = new Set(stages.filter((s) => s.status === 'COMPLETED').map((s) => s.stage));
  for (const stage of STAGE_ORDER) {
    if (!completed.has(stage)) return stage;
  }
  return null;
}

export default function PipelinePage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const queryClient = useQueryClient();

  const { data: runs, isLoading } = useQuery<RunWithStages[]>({
    queryKey: ['pipeline-runs', ideaId],
    queryFn: () => api.get(`/pipeline/ideas/${ideaId}/runs`).then((r) => r.data),
  });

  const latestRun = runs?.[0] ?? null;

  usePipelineSocket(latestRun?.id ?? null);

  const { data: liveRun } = useQuery<RunWithStages>({
    queryKey: ['pipeline-run', latestRun?.id],
    queryFn: () => api.get(`/pipeline/runs/${latestRun!.id}`).then((r) => r.data),
    enabled: !!latestRun?.id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'IN_PROGRESS' || status === 'PENDING' ? 5000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: () => api.post('/pipeline/start', { ideaId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pipeline-runs', ideaId] });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: (stage: StageType) =>
      api.post('/pipeline/trigger-stage', {
        runId: displayRun!.id,
        stage,
        options: {},
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pipeline-run', latestRun?.id] });
    },
  });

  const displayRun = liveRun ?? latestRun;
  const nextStage = displayRun ? getNextStage(displayRun.stages) : null;
  const hasInProgress = displayRun?.stages.some((s) => s.status === 'IN_PROGRESS');

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ideas" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Content Pipeline</h1>
          <p className="text-zinc-400 text-sm">Track every stage from script to posted.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending || displayRun?.status === 'IN_PROGRESS'}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {startMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {displayRun ? 'Re-run Pipeline' : 'Start Pipeline'}
        </button>

        {displayRun && nextStage && nextStage !== 'SCRIPT' && !hasInProgress && (
          <button
            onClick={() => triggerMutation.mutate(nextStage)}
            disabled={triggerMutation.isPending}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
          >
            {triggerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Run {nextStage}
          </button>
        )}

        {displayRun && (
          <span className={[
            'text-xs font-medium px-2.5 py-1 rounded-full',
            displayRun.status === 'COMPLETED' && 'bg-emerald-950 text-emerald-400',
            displayRun.status === 'IN_PROGRESS' && 'bg-brand-950 text-brand-400',
            displayRun.status === 'FAILED' && 'bg-red-950 text-red-400',
            displayRun.status === 'PENDING' && 'bg-zinc-800 text-zinc-400',
          ].filter(Boolean).join(' ')}>
            {displayRun.status}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : !displayRun ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">No pipeline run yet. Start one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayRun.stages.length === 0 ? (
            <p className="text-zinc-500 text-sm">Pipeline is initialising…</p>
          ) : (
            displayRun.stages.map((stage) => (
              <StageCard key={stage.id} stage={stage} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
