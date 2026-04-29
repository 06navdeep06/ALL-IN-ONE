'use client';

import { CheckCircle, Circle, Loader2, XCircle, RotateCcw } from 'lucide-react';
import type { PipelineStage, StageStatus, StageType } from '@repo/shared-types';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<StageType, string> = {
  SCRIPT: '📝 Script Generation',
  AUDIO: '🎙️ Audio Generation',
  VIDEO: '🎬 Video Generation',
  CAPTIONS: '💬 Captions',
  EXPORT: '🚀 Export / Publish',
};

const STATUS_ICON: Record<StageStatus, React.ReactNode> = {
  PENDING: <Circle className="w-5 h-5 text-zinc-600" />,
  IN_PROGRESS: <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />,
  COMPLETED: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  FAILED: <XCircle className="w-5 h-5 text-red-400" />,
  RETRYING: <RotateCcw className="w-5 h-5 text-amber-400 animate-spin" />,
};

const STATUS_BORDER: Record<StageStatus, string> = {
  PENDING: 'border-zinc-800',
  IN_PROGRESS: 'border-brand-800',
  COMPLETED: 'border-emerald-900',
  FAILED: 'border-red-900',
  RETRYING: 'border-amber-900',
};

interface Props {
  stage: PipelineStage;
}

export function StageCard({ stage }: Props) {
  return (
    <div className={cn('bg-zinc-900 border rounded-xl p-4 flex items-start gap-4', STATUS_BORDER[stage.status])}>
      <div className="shrink-0 mt-0.5">{STATUS_ICON[stage.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white text-sm">{STAGE_LABELS[stage.stage]}</h3>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            stage.status === 'COMPLETED' && 'bg-emerald-950 text-emerald-400',
            stage.status === 'IN_PROGRESS' && 'bg-brand-950 text-brand-400',
            stage.status === 'FAILED' && 'bg-red-950 text-red-400',
            stage.status === 'RETRYING' && 'bg-amber-950 text-amber-400',
            stage.status === 'PENDING' && 'bg-zinc-800 text-zinc-400',
          )}>
            {stage.status}
          </span>
        </div>

        {stage.status === 'FAILED' && stage.errorMsg && (
          <p className="text-xs text-red-400 mt-1.5 font-mono bg-red-950/30 rounded p-2 break-all">
            {stage.errorMsg}
          </p>
        )}

        {stage.status === 'COMPLETED' && stage.outputUrl && (
          <a
            href={stage.outputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 mt-1.5 block truncate"
          >
            View output →
          </a>
        )}

        {stage.status === 'COMPLETED' && stage.outputData && stage.stage === 'SCRIPT' && (
          <div className="mt-2 space-y-1">
            {(['hook', 'body', 'cta'] as const).map((key) => {
              const data = stage.outputData as Record<string, string> | null;
              return data?.[key] ? (
                <div key={key} className="text-xs bg-zinc-800 rounded p-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">{key}</span>
                  <p className="text-zinc-300 mt-0.5">{data[key]}</p>
                </div>
              ) : null;
            })}
          </div>
        )}

        {stage.attempts > 1 && (
          <p className="text-xs text-zinc-500 mt-1">Attempt {stage.attempts}</p>
        )}
      </div>
    </div>
  );
}
