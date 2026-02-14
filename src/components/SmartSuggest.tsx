'use client';

import { useEffect, useState } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  bpm: number;
  key: string;
  energy: number;
  compatibility?: number;
}

interface SmartSuggestProps {
  lastTrack: { bpm: number; key: string } | null;
  onAddTrack: (track: Track) => void;
}

function compatScore(a: { bpm: number; key: string }, b: { bpm: number; key: string }): number {
  const numA = parseInt(a.key), numB = parseInt(b.key);
  const letA = a.key.slice(-1), letB = b.key.slice(-1);
  const keyDist = Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
  const keyScore = keyDist === 0 ? (letA === letB ? 100 : 90) : keyDist === 1 ? (letA === letB ? 80 : 70) : Math.max(0, 60 - keyDist * 15);
  const bpmDiff = Math.abs(a.bpm - b.bpm);
  const bpmScore = bpmDiff <= 2 ? 100 : bpmDiff <= 5 ? 85 : bpmDiff <= 10 ? 70 : Math.max(0, 60 - bpmDiff * 2);
  return Math.round(keyScore * 0.6 + bpmScore * 0.4);
}

function dotColor(score: number) {
  if (score >= 80) return 'bg-green-400';
  if (score >= 60) return 'bg-golden';
  if (score >= 40) return 'bg-coral';
  return 'bg-red-400';
}

export default function SmartSuggest({ lastTrack, onAddTrack }: SmartSuggestProps) {
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lastTrack) return;
    setLoading(true);
    fetch('/api/spotify/library')
      .then(r => r.ok ? r.json() : [])
      .then((tracks: Track[]) => {
        const scored = tracks
          .map(t => ({ ...t, compatibility: compatScore(lastTrack, t) }))
          .sort((a, b) => b.compatibility - a.compatibility)
          .slice(0, 8);
        setSuggestions(scored);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lastTrack?.bpm, lastTrack?.key]);

  if (!lastTrack) return null;

  return (
    <div className="rounded-2xl bg-card border border-white/5 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/40">Smart Suggestions</h3>
      {loading ? (
        <div className="flex justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple border-t-transparent" /></div>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-cream/30">No suggestions available</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {suggestions.map(track => (
            <button key={track.id} onClick={() => onAddTrack(track)} className="group flex-none w-28 rounded-xl bg-white/5 p-2 hover:bg-white/10 transition-colors text-left">
              <div className="relative">
                <img src={track.artwork_url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <div className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full ${dotColor(track.compatibility || 0)} ring-2 ring-card`} />
              </div>
              <p className="mt-2 truncate text-xs font-medium text-cream">{track.title}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-cream/40">
                <span>{track.bpm}</span>
                <span className="rounded bg-white/10 px-1 py-0.5">{track.key}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
