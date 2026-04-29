import type { IdeaStatus } from '@repo/shared-types';
import { cn } from '@/lib/utils';

const config: Record<IdeaStatus, { label: string; className: string }> = {
  IDEA: { label: 'Idea', className: 'bg-zinc-800 text-zinc-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-brand-950 text-brand-400 border border-brand-900' },
  POSTED: { label: 'Posted', className: 'bg-emerald-950 text-emerald-400 border border-emerald-900' },
};

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  const { label, className } = config[status];
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
}
