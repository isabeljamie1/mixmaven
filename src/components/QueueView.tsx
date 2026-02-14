'use client';

import Image from 'next/image';
import { Track } from '@/hooks/useAudioPlayer';

interface QueueViewProps {
  tracks: Track[];
  currentTrackIndex: number;
}

export default function QueueView({ tracks, currentTrackIndex }: QueueViewProps) {
  return (
    <div className="px-6 pb-28">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-3">Queue</h3>
      <div className="space-y-1">
        {tracks.map((track, i) => {
          const isPlayed = i < currentTrackIndex;
          const isCurrent = i === currentTrackIndex;
          const noPreview = !track.preview_url;

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 py-2 px-2 rounded-lg ${
                isCurrent ? 'bg-card' : ''
              }`}
            >
              <span className={`text-xs w-4 text-right ${
                isCurrent ? 'text-coral' : 'text-neutral-600'
              }`}>
                {i + 1}
              </span>

              <div className={`w-9 h-9 rounded-lg overflow-hidden relative flex-shrink-0 ${
                isPlayed ? 'opacity-50' : ''
              }`}>
                {track.album_art_url ? (
                  <Image
                    src={track.album_art_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-sm ${
                    isPlayed ? 'bg-neutral-800' : 'bg-card'
                  }`}>
                    🎵
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${
                  isPlayed ? 'text-neutral-600 line-through' :
                  isCurrent ? 'text-coral font-medium' : 'text-cream'
                }`}>
                  {track.title}
                  {noPreview && <span className="text-neutral-600 text-[10px] ml-1">(no preview)</span>}
                </p>
                <p className={`text-xs truncate ${
                  isPlayed ? 'text-neutral-700' : 'text-neutral-500'
                }`}>
                  {track.artist} · {track.bpm} BPM · {track.key}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
