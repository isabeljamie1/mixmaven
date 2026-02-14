'use client';

import { Track, useAudioPlayer } from '@/hooks/useAudioPlayer';
import TransitionCard from './TransitionCard';
import QueueView from './QueueView';

interface NowPlayingProps {
  tracks: Track[];
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const EMOJIS = ['🎵', '💃', '🔥', '✨'];

export default function NowPlaying({ tracks }: NowPlayingProps) {
  const {
    isPlaying, currentTrackIndex, currentTime, duration,
    play, pause, next, previous, currentTrack,
  } = useAudioPlayer(tracks);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const nextTrack = tracks[currentTrackIndex + 1] || null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] py-4">
        <button className="text-cream/60 text-xl">←</button>
        <span className="text-cream/40 text-xs font-semibold uppercase tracking-[0.2em]">Playing</span>
        <button className="text-cream/60 text-xl">↗</button>
      </div>

      {/* Album Art */}
      <div className="flex justify-center px-6 mt-2">
        <div className="w-[260px] h-[260px] rounded-2xl bg-gradient-to-br from-coral/30 via-mauve/30 to-purple/30 flex items-center justify-center">
          <span className="text-7xl">{EMOJIS[currentTrackIndex % EMOJIS.length]}</span>
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center mt-8 px-6">
        <h1 className="font-serif text-cream text-2xl leading-tight">{currentTrack.title}</h1>
        <p className="text-neutral-500 text-sm mt-1">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mt-8">
        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-coral to-mauve transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-neutral-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-10 mt-6">
        <button
          onClick={previous}
          className="text-cream/50 text-2xl hover:text-cream transition-colors"
          disabled={currentTrackIndex === 0}
        >
          ⏮
        </button>

        <button
          onClick={isPlaying ? pause : play}
          className="w-[60px] h-[60px] rounded-full bg-coral flex items-center justify-center text-white text-2xl hover:bg-coral/90 transition-colors active:scale-95"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={next}
          className="text-cream/50 text-2xl hover:text-cream transition-colors"
          disabled={currentTrackIndex === tracks.length - 1}
        >
          ⏭
        </button>
      </div>

      {/* Transition Card */}
      <div className="mt-6">
        <TransitionCard
          currentTrack={currentTrack}
          nextTrack={nextTrack}
          currentTime={currentTime}
          duration={duration}
        />
      </div>

      {/* Queue */}
      <div className="mt-6">
        <QueueView tracks={tracks} currentTrackIndex={currentTrackIndex} />
      </div>
    </div>
  );
}
