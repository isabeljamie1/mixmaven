'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith('spotify_user='));
      if (raw) setUser(JSON.parse(decodeURIComponent(raw.split('=')[1])));
    } catch {}
  }, []);

  const handleLogout = () => {
    document.cookie = 'spotify_user=; path=/; max-age=0';
    document.cookie = 'spotify_token=; path=/; max-age=0';
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg text-cream">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push('/dashboard')} className="font-display text-2xl font-bold bg-gradient-to-r from-golden via-coral to-purple bg-clip-text text-transparent">
            MixMaven
          </button>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm text-cream/70">{user.name}</span>
              </>
            )}
            <button onClick={handleLogout} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-cream/60 hover:text-cream hover:border-white/20 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t border-white/5 py-6 text-center">
        <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="text-sm text-cream/30 hover:text-green-400 transition-colors">
          Powered by Spotify ↗
        </a>
      </footer>
    </div>
  );
}
