'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string;
  avatar: string;
  spotify_url?: string;
}

interface Stats {
  total_mixes: number;
  total_tracks: number;
  avg_flow_score: number | null;
}

interface Mix {
  id: string;
  title: string;
  track_count: number;
  flow_score: number | null;
  created_at: string;
  is_public: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [stats, setStats] = useState<Stats>({ total_mixes: 0, total_tracks: 0, avg_flow_score: null });
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith('spotify_user='));
      if (raw) {
        const u = JSON.parse(decodeURIComponent(raw.split('=')[1]));
        setUser(u);
        setUsername(u.name);
      }
    } catch {}

    fetch('/api/mixes').then(r => r.ok ? r.json() : []).then((data: Mix[]) => {
      setMixes(data);
      const scores = data.map(m => m.flow_score).filter((s): s is number => s !== null);
      setStats({
        total_mixes: data.length,
        total_tracks: data.reduce((sum, m) => sum + (m.track_count || 0), 0),
        avg_flow_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      });
    }).catch(() => {});
  }, []);

  const handleSaveUsername = () => {
    if (user) {
      const updated = { ...user, name: username };
      document.cookie = `spotify_user=${encodeURIComponent(JSON.stringify(updated))}; path=/`;
      setUser(updated);
    }
    setEditing(false);
  };

  const publicMixes = mixes.filter(m => m.is_public);

  return (
    <div className="min-h-screen bg-bg text-cream">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Profile header */}
        <div className="flex items-center gap-6 mb-10">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-golden/30" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-golden to-purple" />
          )}
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input value={username} onChange={e => setUsername(e.target.value)} className="rounded-lg bg-card px-3 py-1.5 text-lg font-display text-cream outline-none focus:ring-1 focus:ring-golden" />
                <button onClick={handleSaveUsername} className="rounded-lg bg-golden/20 px-3 py-1.5 text-sm text-golden">Save</button>
                <button onClick={() => setEditing(false)} className="text-sm text-cream/40">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold">{user?.name || 'User'}</h1>
                <button onClick={() => setEditing(true)} className="text-xs text-cream/30 hover:text-cream/60">Edit</button>
              </div>
            )}
            {user?.spotify_url && (
              <a href={user.spotify_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-green-400 hover:underline">
                Open Spotify Profile ↗
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Mixes', value: stats.total_mixes },
            { label: 'Tracks Used', value: stats.total_tracks },
            { label: 'Avg Flow', value: stats.avg_flow_score !== null ? stats.avg_flow_score : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card border border-white/5 p-4 text-center">
              <p className="font-display text-2xl font-bold bg-gradient-to-r from-golden to-coral bg-clip-text text-transparent">{s.value}</p>
              <p className="mt-1 text-xs text-cream/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Public mixes */}
        <h2 className="font-display text-lg font-bold mb-4">Public Mixes</h2>
        {publicMixes.length === 0 ? (
          <p className="text-sm text-cream/30">No public mixes yet</p>
        ) : (
          <div className="space-y-3">
            {publicMixes.map(mix => (
              <button key={mix.id} onClick={() => router.push(`/mix/${mix.id}`)} className="w-full flex items-center justify-between rounded-xl bg-card border border-white/5 p-4 hover:border-white/10 transition-colors text-left">
                <div>
                  <p className="font-display font-bold text-cream">{mix.title}</p>
                  <p className="text-xs text-cream/40">{mix.track_count} tracks · {new Date(mix.created_at).toLocaleDateString()}</p>
                </div>
                {mix.flow_score !== null && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${mix.flow_score >= 80 ? 'bg-green-500/20 text-green-400' : mix.flow_score >= 60 ? 'bg-golden/20 text-golden' : 'bg-coral/20 text-coral'}`}>
                    {Math.round(mix.flow_score)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <button onClick={() => router.push('/dashboard')} className="mt-10 text-sm text-cream/30 hover:text-cream/60 transition-colors">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
