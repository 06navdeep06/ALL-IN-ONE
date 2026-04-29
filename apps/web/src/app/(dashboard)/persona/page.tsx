'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, User, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';

interface PersonaProfile {
  id: string;
  toneDescriptor?: string | null;
  captionStyle?: string | null;
  titleConventions?: string | null;
  avgVideoLength?: number | null;
  scriptStructure?: Record<string, unknown> | null;
  updatedAt: string;
}

export default function PersonaPage() {
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  const { data: profile, isLoading } = useQuery<PersonaProfile | null>({
    queryKey: ['persona-profile'],
    queryFn: () => api.get('/persona/profile').then((r) => r.data),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.post('/persona/analyze', { instagram, tiktok }),
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Persona AI</h1>
        <p className="text-zinc-400 mt-1">
          Train the AI to match your unique creator style. Provide your social links to analyse
          your content patterns.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Analyse Your Style</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Instagram Profile URL</label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/yourusername"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">TikTok Profile URL</label>
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@yourusername"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending || (!instagram && !tiktok)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Analyse My Style
        </button>
        {analyzeMutation.isSuccess && (
          <p className="text-sm text-emerald-400">
            Analysis queued! Your persona profile will update shortly.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : !profile ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 border-dashed rounded-xl">
          <User className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No persona profile yet. Analyse your style above.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Your Persona Profile</h2>
            <span className="text-xs text-zinc-500">
              Updated {new Date(profile.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {profile.toneDescriptor && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Tone</p>
              <p className="text-sm text-zinc-300">{profile.toneDescriptor}</p>
            </div>
          )}

          {profile.captionStyle && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Caption Style</p>
              <p className="text-sm text-zinc-300">{profile.captionStyle}</p>
            </div>
          )}

          {profile.titleConventions && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Title Conventions</p>
              <p className="text-sm text-zinc-300">{profile.titleConventions}</p>
            </div>
          )}

          {profile.avgVideoLength && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Avg Video Length</p>
              <p className="text-sm text-zinc-300">{profile.avgVideoLength}s</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
