'use client';

import { useState } from 'react';

interface MixCardProps {
  mix: {
    id: string;
    title: string;
    track_count: number;
    flow_score: number | null;
    created_at: string;
    duration_ms: number;
    tracks: { artwork_url: string }[];
  };
  onClick: () => void;
  onDelete: () => void;
}

function flowColor(score: number | null) {
  if (score === null) return 'bg-white/20 text-cream/50';
  if (score >= 80) return 'bg-green-500/20 text-green-400';
  if (score >= 60) return 'bg-golden/20 text-golden';
  if (score >= 40) return 'bg-coral/20 text-coral';
  return 'bg-red-500/20 text-red-400';
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function MixCard({ mix, onClick, onDelete }: MixCardProps) {
  const [confirming, setConfirming] = useState(false);
  const artworks = (mix.tracks || []).slice(0, 4).map(t => t.artwork_url);

  return (
    <div onClick={onClick} className="group relative cursor-pointer rounded-2xl bg-card p-[1px] transition-all hover:bg-gradient-to-br hover:from-golden hover:via-coral hover:to-purple">
      <div className="rounded-2xl bg-card p-5">
        {/* Art grid */}
        <div className="mb-4 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-white/5">
              {artworks[i] ? <img src={artworks[i]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-purple/20 to-coral/20" />}
            </div>
          ))}
        </div>

        <h3 className="font-display text-lg font-bold text-cream truncate">{mix.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-cream/50">
          <span>{mix.track_count} tracks</span>
          <span>·</span>
          <span>{formatDuration(mix.duration_ms)}</span>
          {mix.flow_score !== null && (
            <>
              <span>·</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${flowColor(mix.flow_score)}`}>
                {Math.round(mix.flow_score)}
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-cream/30">{new Date(mix.created_at).toLocaleDateString()}</p>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); if (confirming) { onDelete(); } else { setConfirming(true); } }}
          onBlur={() => setConfirming(false)}
          className="absolute right-3 top-3 rounded-lg bg-black/50 p-1.5 text-cream/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
        >
          {confirming ? (
            <span className="px-1 text-xs text-red-400">Delete?</span>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
