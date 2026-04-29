'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { CreateIdeaSchema, type CreateIdeaInput } from '@repo/zod-schemas';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateIdeaModal({ onClose, onCreated }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateIdeaInput>({
    resolver: zodResolver(CreateIdeaSchema),
    defaultValues: { score: 50 },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateIdeaInput) => api.post('/ideas', data),
    onSuccess: onCreated,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">New Idea</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
            <input
              {...register('title')}
              placeholder="My awesome content idea..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="More context about this idea..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Series</label>
              <input
                {...register('series')}
                placeholder="e.g. Dev Tips"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Episode</label>
              <input
                {...register('episode', { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Priority Score: <span className="text-brand-400">50</span>
            </label>
            <input
              {...register('score', { valueAsNumber: true })}
              type="range"
              min={0}
              max={100}
              className="w-full accent-brand-600"
            />
          </div>

          {mutation.error && (
            <p className="text-red-400 text-sm">Failed to create idea. Try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
