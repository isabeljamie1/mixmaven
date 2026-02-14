'use client';

import Image from 'next/image';

interface ShareCardTrack {
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  albumArt?: string;
}

interface ShareCardProps {
  title: string;
  author: string;
  trackCount: number;
  duration: string;
  tracks: ShareCardTrack[];
  flowScore: number;
  avgBpm: number;
  smoothTransitions: string;
}

export default function ShareCard({
  title,
  author,
  trackCount,
  duration,
  tracks,
  flowScore,
  avgBpm,
  smoothTransitions,
}: ShareCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800">
      <div className="relative bg-card p-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(240, 138, 93, 0.12) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(198, 100, 160, 0.12) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10">
          <p className="text-neutral-600 text-xs font-medium tracking-widest uppercase mb-4">
            MixMaven
          </p>

          <h2 className="font-serif text-[28px] text-cream leading-tight mb-1">
            {title}
          </h2>

          <p className="text-neutral-400 text-sm mb-5">
            by {author} · {trackCount} tracks · {duration}
          </p>

          {/* Mini track art */}
          <div className="flex gap-2 mb-5">
            {tracks.slice(0, 4).map((t, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-base overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})`,
                }}
              >
                {t.albumArt ? (
                  <Image
                    src={t.albumArt}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  t.emoji
                )}
              </div>
            ))}
            {trackCount > 4 && (
              <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs font-semibold">
                +{trackCount - 4}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div>
              <p className="text-coral text-lg font-semibold">{flowScore}</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-wide">
                Flow Score
              </p>
            </div>
            <div>
              <p className="text-mauve text-lg font-semibold">{avgBpm}</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-wide">
                Avg BPM
              </p>
            </div>
            <div>
              <p className="text-cream text-lg font-semibold">{smoothTransitions}</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-wide">
                Smooth
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
