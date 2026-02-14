'use client';

import Image from 'next/image';
import { Track, useAudioPlayer } from '@/hooks/useAudioPlayer';
import TransitionCard from './TransitionCard';
import QueueView from './QueueView';

interface NowPlayingProps {
  tracks: Track[];
  mixName?: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function NowPlaying({ tracks, mixName }: NowPlayingProps) {
  const {
    isPlaying, currentTrackIndex, currentTime, duration, volume,
    play, pause, next, previous, setVolume, currentTrack, hasPreview,
  } = useAudioPlayer(tracks);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const nextTrack = tracks[currentTrackIndex + 1] || null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] py-4">
        <button className="text-cream/60 text-xl">←</button>
        <div className="text-center">
          <span className="text-cream/40 text-xs font-semibold uppercase tracking-[0.2em]">Playing</span>
          {mixName && <p className="text-cream/60 text-xs mt-0.5">{mixName}</p>}
        </div>
        <button className="text-cream/60 text-xl">↗</button>
      </div>

      {/* Album Art */}
      <div className="flex justify-center px-6 mt-2">
        {currentTrack.album_art_url ? (
          <div className="w-[260px] h-[260px] rounded-2xl overflow-hidden relative shadow-2xl">
            <Image
              src={currentTrack.album_art_url}
              alt={`${currentTrack.title} album art`}
              fill
              className="object-cover"
              sizes="260px"
              priority
            />
          </div>
        ) : (
          <div className="w-[260px] h-[260px] rounded-2xl bg-gradient-to-br from-coral/30 via-mauve/30 to-purple/30 flex items-center justify-center">
            <span className="text-7xl">🎵</span>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="text-center mt-8 px-6">
        <h1 className="font-serif text-cream text-2xl leading-tight">{currentTrack.title}</h1>
        <p className="text-neutral-500 text-sm mt-1">{currentTrack.artist}</p>
        {!hasPreview && (
          <p className="text-coral/70 text-xs mt-2 bg-coral/10 rounded-full px-3 py-1 inline-block">
            No preview available
          </p>
        )}
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

      {/* Controls — pushed toward bottom for thumb reach */}
      <div className="flex items-center justify-center gap-10 mt-auto pt-6">
        <button
          onClick={previous}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-cream/50 text-2xl hover:text-cream transition-colors disabled:opacity-30"
          disabled={currentTrackIndex === 0}
        >
          ⏮
        </button>

        <button
          onClick={isPlaying ? pause : play}
          className={`w-[64px] h-[64px] rounded-full flex items-center justify-center text-white text-2xl transition-colors active:scale-95 ${
            hasPreview ? 'bg-coral hover:bg-coral/90' : 'bg-neutral-700 cursor-not-allowed'
          }`}
          disabled={!hasPreview}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={next}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-cream/50 text-2xl hover:text-cream transition-colors disabled:opacity-30"
          disabled={currentTrackIndex === tracks.length - 1}
        >
          ⏭
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-10 mt-4">
        <span className="text-neutral-600 text-xs">🔈</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-coral bg-neutral-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-coral"
        />
        <span className="text-neutral-600 text-xs">🔊</span>
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
