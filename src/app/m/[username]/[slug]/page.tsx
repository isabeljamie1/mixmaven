import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Mix } from '@/lib/types';

interface PageProps {
  params: { username: string; slug: string };
}

async function getMix(username: string, slug: string): Promise<Mix | null> {
  const supabase = createClient();

  // Look up mix by username + slug (slug derived from mix name)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) return null;

  const { data: mixes } = await supabase
    .from('mixes')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (!mixes) return null;

  // Match by slug (derived from name)
  return mixes.find((m: Mix) => {
    const mSlug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return mSlug === slug;
  }) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const mix = await getMix(params.username, params.slug);

  if (!mix) {
    return { title: 'Mix not found | MixMaven' };
  }

  const trackNames = mix.tracks.slice(0, 4).map((t) => t.track.name).join(', ');
  const avgBpm = Math.round(mix.tracks.reduce((s, t) => s + t.bpm, 0) / mix.tracks.length);
  const description = `${mix.tracks.length} tracks · ${avgBpm} avg BPM · Flow score ${mix.flowScore} · ${trackNames}`;
  const ogImageUrl = `/api/og/${mix.id}`;

  return {
    title: `${mix.name} — a mix by ${params.username} | MixMaven`,
    description,
    openGraph: {
      title: `${mix.name} — a mix by ${params.username}`,
      description,
      images: [ogImageUrl],
      type: 'music.playlist',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${mix.name} — a mix by ${params.username}`,
      description,
      images: [ogImageUrl],
    },
  };
}

const DOT_COLORS = { green: '#34D399', yellow: '#FBBF24', red: '#F87171' };

export default async function PublicMixPage({ params }: PageProps) {
  const mix = await getMix(params.username, params.slug);

  if (!mix) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🎵</p>
          <p className="text-cream text-lg font-semibold">Mix not found</p>
          <p className="text-neutral-500 text-sm mt-2">This mix may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const avgBpm = Math.round(mix.tracks.reduce((s, t) => s + t.bpm, 0) / mix.tracks.length);
  const totalMs = mix.tracks.reduce((s, t) => s + (t.audio?.duration_ms || 0), 0);
  const durationStr = `${Math.floor(totalMs / 60000)}:${Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[430px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-neutral-600 text-xs font-medium tracking-widest uppercase mb-4">
            MixMaven
          </p>
          <h1 className="font-serif text-[32px] text-cream leading-tight">{mix.name}</h1>
          <p className="text-neutral-400 text-sm mt-1">
            by {params.username} · {mix.tracks.length} tracks · {durationStr}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mb-8 p-4 bg-card rounded-xl border border-neutral-800">
          <div>
            <p className="text-coral text-lg font-semibold">{mix.flowScore}</p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wide">Flow</p>
          </div>
          <div>
            <p className="text-mauve text-lg font-semibold">{avgBpm}</p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wide">Avg BPM</p>
          </div>
          <div>
            <p className="text-cream text-lg font-semibold">
              {mix.transitions.filter((t) => t.color === 'green').length}/{mix.transitions.length}
            </p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wide">Smooth</p>
          </div>
        </div>

        {/* Track List */}
        <h3 className="text-cream text-sm font-semibold tracking-widest uppercase mb-4">
          Tracklist
        </h3>

        {mix.tracks.map((mt, i) => {
          const albumArt = mt.track.album?.images?.[mt.track.album.images.length - 1]?.url;
          const durationSec = Math.floor((mt.audio?.duration_ms || 0) / 1000);
          const durStr = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`;

          return (
            <div key={mt.track.id}>
              <div className="flex items-center gap-3 py-3">
                <span className="text-neutral-500 text-xs w-4 text-center">
                  {i + 1}
                </span>
                <div className="w-11 h-11 rounded-lg overflow-hidden relative flex-shrink-0 bg-card">
                  {albumArt ? (
                    <Image src={albumArt} alt="" fill className="object-cover" sizes="44px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🎵</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-sm font-medium truncate">
                    {mt.track.name}
                  </p>
                  <p className="text-neutral-400 text-xs truncate">
                    {mt.track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-coral text-xs font-semibold">{mt.bpm}</p>
                  <p className="text-mauve text-xs">{mt.camelot}</p>
                </div>
                <span className="text-neutral-600 text-xs">{durStr}</span>
              </div>

              {/* Transition indicator */}
              {i < mix.transitions.length && (
                <div className="flex items-center gap-2 pl-[60px] py-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DOT_COLORS[mix.transitions[i].color] }}
                  />
                  <span className="text-neutral-500 text-[11px]">
                    {mix.transitions[i].label} · {mix.transitions[i].details}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/mix/${mix.id}/play`}
            className="w-full py-3.5 rounded-xl bg-coral text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            ▶ Listen on MixMaven
          </Link>
          <Link
            href={`/mix/${mix.id}/play`}
            className="w-full py-3.5 rounded-xl bg-card text-cream font-semibold text-sm flex items-center justify-center gap-2 border border-neutral-800 active:scale-[0.98] transition-transform"
          >
            🔀 Remix this mix
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 mb-6 text-center">
          <p className="text-neutral-600 text-xs">
            Made with{' '}
            <a href="https://mixmaven.io" className="text-coral hover:underline">
              MixMaven
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
