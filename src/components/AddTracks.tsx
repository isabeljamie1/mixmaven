'use client';

import { useState, useEffect } from 'react';
import type { TrackRowData } from './TrackRow';

export interface SuggestedTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  camelot: string;
  energy: number;
  isMatch: boolean;
  albumArt?: string;
  emoji?: string;
  gradientFrom?: string;
  gradientTo?: string;
  uri?: string;
}

interface AddTracksProps {
  suggestions?: SuggestedTrack[];
  libraryTracks?: SuggestedTrack[];
  lastTrack?: TrackRowData | null;
  onAdd?: (track: SuggestedTrack) => void;
}

type Tab = 'search' | 'library';

export default function AddTracks({ suggestions = [], libraryTracks = [], onAdd }: AddTracksProps) {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCompatible, setFilterCompatible] = useState(false);

  // Debounced search
  useEffect(() => {
    if (tab !== 'search' || query.length < 2) {
      setResults(suggestions);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.tracks ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, tab, suggestions]);

  const displayTracks = tab === 'library'
    ? (filterCompatible ? libraryTracks.filter(t => t.isMatch) : libraryTracks)
    : (query.length >= 2 ? results : suggestions);

  return (
    <div className="mt-6 px-4">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-cream font-serif text-lg">Add Tracks</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('search')}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${tab === 'search' ? 'bg-golden/20 text-golden' : 'text-neutral-400'}`}
          >
            Search
          </button>
          <button
            onClick={() => setTab('library')}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${tab === 'library' ? 'bg-golden/20 text-golden' : 'text-neutral-400'}`}
          >
            Library
          </button>
        </div>
      </div>

      {/* Search input */}
      {tab === 'search' && (
        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists..."
            className="w-full bg-[#1a1a1a] text-cream text-sm rounded-xl px-4 py-2.5 outline-none border border-neutral-700 focus:border-golden/50 placeholder:text-neutral-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-golden/30 border-t-golden rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Library filter */}
      {tab === 'library' && (
        <button
          onClick={() => setFilterCompatible(!filterCompatible)}
          className={`text-xs mb-3 px-3 py-1.5 rounded-full transition-colors ${filterCompatible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/50 text-neutral-400'}`}
        >
          {filterCompatible ? '✓ Compatible only' : 'Show compatible only'}
        </button>
      )}

      {/* Results */}
      <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
        {displayTracks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2.5 px-2">
            {/* Art */}
            <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
              {t.albumArt ? (
                <img src={t.albumArt} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-base"
                  style={{
                    background: `linear-gradient(135deg, ${t.gradientFrom || '#6B2D7B'}, ${t.gradientTo || '#C664A0'})`,
                  }}
                >
                  {t.emoji || '🎵'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-cream text-sm truncate">{t.title}</p>
                {t.isMatch && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    MATCH
                  </span>
                )}
              </div>
              <p className="text-neutral-400 text-xs truncate">
                {t.artist} · <span className="text-coral">{t.bpm}</span> · <span className="text-mauve">{t.camelot}</span>
                {t.energy != null && (
                  <> · <span className="text-golden">{Math.round(t.energy * 100)}%</span></>
                )}
              </p>
            </div>

            {/* Add button */}
            <button
              onClick={() => onAdd?.(t)}
              className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-white text-lg flex-shrink-0 active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        ))}
        {displayTracks.length === 0 && (
          <p className="text-neutral-500 text-sm text-center py-6">
            {tab === 'search' ? 'Type to search Spotify...' : 'No tracks in library'}
          </p>
        )}
      </div>
    </div>
  );
}
