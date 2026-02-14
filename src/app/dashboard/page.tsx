'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MixCard from '@/components/MixCard';

interface Mix {
  id: string;
  title: string;
  track_count: number;
  flow_score: number | null;
  created_at: string;
  duration_ms: number;
  tracks: { artwork_url: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith('spotify_user='));
      if (raw) setUser(JSON.parse(decodeURIComponent(raw.split('=')[1])));
    } catch {}
    fetchMixes();
  }, []);

  const fetchMixes = async () => {
    try {
      const res = await fetch('/api/mixes');
      if (res.ok) setMixes(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleNewMix = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/mixes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled Mix' }) });
      if (res.ok) {
        const mix = await res.json();
        router.push(`/mix/${mix.id}`);
      }
    } catch {} finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setMixes(prev => prev.filter(m => m.id !== id));
    await fetch(`/api/mixes/${id}`, { method: 'DELETE' });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-golden border-t-transparent" />
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            {user ? `Hey, ${user.name.split(' ')[0]}` : 'Your Mixes'}
          </h1>
          <p className="mt-1 text-cream/50">{mixes.length} mix{mixes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={handleNewMix} disabled={creating} className="rounded-xl bg-gradient-to-r from-coral to-purple px-5 py-2.5 font-semibold text-white shadow-lg shadow-coral/20 hover:shadow-coral/40 transition-all disabled:opacity-50">
          {creating ? 'Creating…' : '+ New Mix'}
        </button>
      </div>

      {mixes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24">
          <p className="font-display text-2xl text-cream/60 mb-2">No mixes yet</p>
          <p className="text-cream/40 mb-6">Create your first one!</p>
          <button onClick={handleNewMix} disabled={creating} className="rounded-xl bg-gradient-to-r from-golden to-coral px-8 py-3 text-lg font-semibold text-white shadow-lg hover:shadow-golden/30 transition-all">
            {creating ? 'Creating…' : 'Create Your First Mix'}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mixes.map(mix => (
            <MixCard key={mix.id} mix={mix} onClick={() => router.push(`/mix/${mix.id}`)} onDelete={() => handleDelete(mix.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
