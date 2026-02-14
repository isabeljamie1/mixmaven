'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShareScreen from '@/components/ShareScreen';
import { Mix } from '@/lib/types';

function formatDuration(tracks: Mix['tracks']): string {
  const totalMs = tracks.reduce((sum, t) => sum + (t.audio?.duration_ms || 0), 0);
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTrackVisual(index: number) {
  const colors = [
    { from: '#F08A5D', to: '#E45B6C' },
    { from: '#E45B6C', to: '#C664A0' },
    { from: '#C664A0', to: '#6B2D7B' },
    { from: '#6B2D7B', to: '#E8A854' },
  ];
  const emojis = ['🌅', '🔥', '💜', '🌊'];
  return {
    emoji: emojis[index % emojis.length],
    gradientFrom: colors[index % colors.length].from,
    gradientTo: colors[index % colors.length].to,
    albumArt: undefined as string | undefined,
  };
}

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const [mix, setMix] = useState<Mix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMix() {
      try {
        const res = await fetch(`/api/mixes/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        setMix(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchMix();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <p className="text-neutral-500">Mix not found</p>
      </div>
    );
  }

  const avgBpm = Math.round(mix.tracks.reduce((s, t) => s + t.bpm, 0) / mix.tracks.length);
  const smoothCount = mix.transitions.filter((t) => t.color === 'green').length;
  const trackVisuals = mix.tracks.map((mt, i) => {
    const v = getTrackVisual(i);
    const art = mt.track.album?.images?.[0]?.url;
    return { ...v, albumArt: art };
  });

  // Generate slug from mix name
  const slug = mix.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <ShareScreen
      mixTitle={mix.name}
      author="You"
      username="me"
      slug={slug}
      trackCount={mix.tracks.length}
      duration={formatDuration(mix.tracks)}
      tracks={trackVisuals}
      flowScore={mix.flowScore}
      avgBpm={avgBpm}
      smoothTransitions={`${smoothCount}/${mix.transitions.length}`}
      onBack={() => router.back()}
    />
  );
}
