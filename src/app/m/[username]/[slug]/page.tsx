import type { Metadata } from 'next';
import ShareCard from '@/components/ShareCard';

// Mock data — same tracks as build screen
const MOCK_TRACKS_FULL = [
  {
    id: '1',
    title: 'Sunset Groove',
    artist: 'Solar Beats',
    bpm: 118,
    camelot: '8B',
    emoji: '🌅',
    gradientFrom: '#F08A5D',
    gradientTo: '#E45B6C',
    duration: '4:12',
  },
  {
    id: '2',
    title: 'Neon Pulse',
    artist: 'Chromatic',
    bpm: 122,
    camelot: '8A',
    emoji: '🔥',
    gradientFrom: '#E45B6C',
    gradientTo: '#C664A0',
    duration: '3:45',
  },
  {
    id: '3',
    title: 'Velvet Rush',
    artist: 'Amethyst',
    bpm: 124,
    camelot: '9A',
    emoji: '💜',
    gradientFrom: '#C664A0',
    gradientTo: '#6B2D7B',
    duration: '4:18',
  },
  {
    id: '4',
    title: 'Golden Hour',
    artist: 'Dusk',
    bpm: 120,
    camelot: '7B',
    emoji: '🌊',
    gradientFrom: '#6B2D7B',
    gradientTo: '#E8A854',
    duration: '3:33',
  },
];

const TRANSITIONS = [
  { label: 'Smooth', keyFrom: '8B', keyTo: '8A', bpmDiff: 4, color: 'green' as const },
  { label: 'Smooth', keyFrom: '8A', keyTo: '9A', bpmDiff: 2, color: 'green' as const },
  { label: 'Workable', keyFrom: '9A', keyTo: '7B', bpmDiff: -4, color: 'yellow' as const },
];

const DOT_COLORS = { green: '#34D399', yellow: '#FBBF24', red: '#F87171' };

export function generateMetadata(): Metadata {
  return {
    title: 'Friday Heat — a mix by Jamie | MixMaven',
    description: '4 tracks · 15:48 · 122 avg BPM · Flow score 4.8',
    openGraph: {
      title: 'Friday Heat — a mix by Jamie',
      description: '4 tracks · 15:48 · 122 avg BPM · Flow score 4.8',
      images: ['/og-placeholder.png'],
      type: 'music.playlist',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Friday Heat — a mix by Jamie',
      description: '4 tracks · 15:48 · 122 avg BPM · Flow score 4.8',
    },
  };
}

export default function PublicMixPage() {
  const shareCardTracks = MOCK_TRACKS_FULL.map((t) => ({
    emoji: t.emoji,
    gradientFrom: t.gradientFrom,
    gradientTo: t.gradientTo,
  }));

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[430px] mx-auto px-4 py-6">
        {/* Share Card */}
        <ShareCard
          title="Friday Heat"
          author="Jamie"
          trackCount={4}
          duration="15:48"
          tracks={shareCardTracks}
          flowScore={4.8}
          avgBpm={122}
          smoothTransitions="3/4"
        />

        {/* Track List */}
        <div className="mt-8">
          <h3 className="text-cream text-sm font-semibold tracking-widest uppercase mb-4">
            Tracklist
          </h3>

          {MOCK_TRACKS_FULL.map((track, i) => (
            <div key={track.id}>
              {/* Track row (read-only) */}
              <div className="flex items-center gap-3 py-3">
                <span className="text-neutral-500 text-xs w-4 text-center">
                  {i + 1}
                </span>
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${track.gradientFrom}, ${track.gradientTo})`,
                  }}
                >
                  {track.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-sm font-medium truncate">
                    {track.title}
                  </p>
                  <p className="text-neutral-400 text-xs truncate">
                    {track.artist}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-coral text-xs font-semibold">{track.bpm}</p>
                  <p className="text-mauve text-xs">{track.camelot}</p>
                </div>
                <span className="text-neutral-600 text-xs">{track.duration}</span>
              </div>

              {/* Transition indicator */}
              {i < TRANSITIONS.length && (
                <div className="flex items-center gap-2 pl-[60px] py-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DOT_COLORS[TRANSITIONS[i].color] }}
                  />
                  <span className="text-neutral-500 text-[11px]">
                    {TRANSITIONS[i].label} · {TRANSITIONS[i].keyFrom} →{' '}
                    {TRANSITIONS[i].keyTo} ·{' '}
                    {TRANSITIONS[i].bpmDiff > 0 ? '+' : ''}
                    {TRANSITIONS[i].bpmDiff} BPM
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button className="w-full py-3.5 rounded-xl bg-coral text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            ▶ Listen on MixMaven
          </button>
          <button className="w-full py-3.5 rounded-xl bg-card text-cream font-semibold text-sm flex items-center justify-center gap-2 border border-neutral-800 active:scale-[0.98] transition-transform">
            🔀 Remix this mix
          </button>
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
