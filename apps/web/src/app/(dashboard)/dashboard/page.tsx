import { TrendingUp, Lightbulb, Film, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Total Ideas', icon: Lightbulb, value: '—', href: '/ideas' },
  { label: 'In Progress', icon: TrendingUp, value: '—', href: '/ideas?status=IN_PROGRESS' },
  { label: 'Posted', icon: CheckCircle, value: '—', href: '/ideas?status=POSTED' },
  { label: 'Pipeline Runs', icon: Film, value: '—', href: '/ideas' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Your content creation pipeline overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 hover:border-brand-600 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-950 flex items-center justify-center group-hover:bg-brand-900 transition-colors">
              <stat.icon className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-zinc-400">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span className="text-zinc-300">Create an idea in the <Link href="/ideas" className="text-brand-400 hover:underline">Ideas</Link> section</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span className="text-zinc-300">Start the pipeline to generate a script with AI</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span className="text-zinc-300">Generate audio, video, and captions through each stage</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span className="text-zinc-300">Export or publish directly to TikTok, Instagram, or YouTube</span>
          </div>
        </div>
      </div>
    </div>
  );
}
