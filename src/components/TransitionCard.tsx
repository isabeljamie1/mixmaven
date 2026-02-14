'use client';

import { Track } from '@/hooks/useAudioPlayer';

interface TransitionCardProps {
  currentTrack: Track;
  nextTrack: Track | null;
  currentTime: number;
  duration: number;
}

function getMatchQuality(currentKey: string, nextKey: string): { color: string; label: string } {
  // Simplified key compatibility
  const keyNum = (k: string) => parseInt(k.replace(/[AB]/, ''));
  const keyLetter = (k: string) => k.replace(/[0-9]/g, '');
  const cn = keyNum(currentKey), nn = keyNum(nextKey);
  const cl = keyLetter(currentKey), nl = keyLetter(nextKey);

  if (currentKey === nextKey) return { color: 'bg-green-500', label: 'Perfect match' };
  if (Math.abs(cn - nn) <= 1 || (cl !== nl && cn === nn))
    return { color: 'bg-green-500', label: 'Key match' };
  if (Math.abs(cn - nn) <= 2) return { color: 'bg-yellow-500', label: 'Close match' };
  return { color: 'bg-red-500', label: 'Key clash' };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TransitionCard({ currentTrack, nextTrack, currentTime, duration }: TransitionCardProps) {
  if (!nextTrack) return null;

  const { color, label } = getMatchQuality(currentTrack.key, nextTrack.key);
  const bpmDiff = nextTrack.bpm - currentTrack.bpm;
  const timeUntilCrossfade = Math.max(0, duration - currentTime - 3);

  return (
    <div className="bg-card rounded-xl p-3.5 mx-6">
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
        <span className="text-cream/80">
          Next: {label} · {currentTrack.key} → {nextTrack.key}
        </span>
      </div>
      <p className="text-neutral-500 text-xs mt-1 ml-4">
        {bpmDiff >= 0 ? '+' : ''}{bpmDiff} BPM · Crossfade in {formatTime(timeUntilCrossfade)}
      </p>
    </div>
  );
}
