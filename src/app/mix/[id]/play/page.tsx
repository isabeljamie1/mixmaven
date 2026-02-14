'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NowPlaying from '@/components/NowPlaying';
import BottomNav from '@/components/BottomNav';
import { Track } from '@/hooks/useAudioPlayer';
import { Mix } from '@/lib/types';

export default function PlayPage() {
  const params = useParams();
  const [mix, setMix] = useState<Mix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMix() {
      try {
        const res = await fetch(`/api/mixes/${params.id}`);
        if (!res.ok) throw new Error('Mix not found');
        const data = await res.json();
        setMix(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load mix');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchMix();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 text-sm mt-4">Loading mix…</p>
        </div>
      </div>
    );
  }

  if (error || !mix) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">😵</p>
          <p className="text-cream text-lg font-semibold">Mix not found</p>
          <p className="text-neutral-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const tracks: Track[] = mix.tracks.map((mt) => ({
    id: mt.track.id,
    title: mt.track.name,
    artist: mt.track.artists.map((a) => a.name).join(', '),
    bpm: mt.bpm,
    key: mt.camelot,
    preview_url: mt.track.preview_url,
    album_art_url: mt.track.album?.images?.[0]?.url || undefined,
  }));

  return (
    <div className="max-w-[430px] mx-auto relative">
      <NowPlaying tracks={tracks} mixName={mix.name} />
      <BottomNav active="play" />
    </div>
  );
}
