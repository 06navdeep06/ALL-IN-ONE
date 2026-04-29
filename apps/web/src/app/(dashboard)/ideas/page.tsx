'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Lightbulb, Play, MoreHorizontal, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Idea } from '@repo/shared-types';
import { CreateIdeaModal } from '@/components/ideas/create-idea-modal';
import { IdeaStatusBadge } from '@/components/ideas/idea-status-badge';
import Link from 'next/link';

export default function IdeasPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: ideas, isLoading } = useQuery<Idea[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ideas</h1>
          <p className="text-zinc-400 mt-1">Your content ideas — the start of every pipeline.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Idea
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : !ideas || ideas.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Lightbulb className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No ideas yet. Create your first one!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-medium"
          >
            + Add your first idea
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">{idea.score}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white truncate">{idea.title}</h3>
                    {idea.series && (
                      <span className="text-xs text-zinc-500 shrink-0">
                        {idea.series}{idea.episode ? ` #${idea.episode}` : ''}
                      </span>
                    )}
                  </div>
                  {idea.description && (
                    <p className="text-sm text-zinc-400 truncate mt-0.5">{idea.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <IdeaStatusBadge status={idea.status} />
                <Link
                  href={`/ideas/${idea.id}/pipeline`}
                  className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
                >
                  <Play className="w-3.5 h-3.5" />
                  Pipeline
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(idea.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateIdeaModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] });
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
