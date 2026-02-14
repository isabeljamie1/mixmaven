'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  bpm: number;
  key: string;
  energy: number;
  compatible?: boolean;
}

interface TrackBrowserProps {
  onAddTrack: (track: Track) => void;
  lastTrack?: { bpm: number; key: string } | null;
}

const CAMELOT_KEYS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','7A','7B','8A','8B','9A','9B','10A','10B','11A','11B','12A','12B'];
const SORT_OPTIONS = [
  { value: 'compatibility', label: 'Compatible' },
  { value: 'bpm', label: 'BPM' },
  { value: 'key', label: 'Key' },
  { value: 'energy', label: 'Energy' },
  { value: 'name', label: 'Name' },
];

function compatibleKeys(key: string): string[] {
  const num = parseInt(key);
  const letter = key.slice(-1);
  const same = `${num}${letter === 'A' ? 'B' : 'A'}`;
  const up = `${num === 12 ? 1 : num + 1}${letter}`;
  const down = `${num === 1 ? 12 : num - 1}${letter}`;
  return [key, same, up, down];
}

export default function TrackBrowser({ onAddTrack, lastTrack }: TrackBrowserProps) {
  const [mode, setMode] = useState<'library' | 'search'>('library');
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('compatibility');
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 200]);
  const [keyFilter, setKeyFilter] = useState('');
  const [energyRange, setEnergyRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const url = mode === 'search' && query
        ? `/api/spotify/search?q=${encodeURIComponent(query)}`
        : '/api/spotify/library';
      const res = await fetch(url);
      if (res.ok) {
        let data: Track[] = await res.json();
        if (lastTrack) {
          const compat = compatibleKeys(lastTrack.key);
          data = data.map(t => ({ ...t, compatible: compat.includes(t.key) }));
        }
        setTracks(data);
      }
    } catch {} finally { setLoading(false); }
  }, [mode, query, lastTrack]);

  useEffect(() => { if (mode === 'library') fetchTracks(); }, [mode, fetchTracks]);

  useEffect(() => {
    if (mode === 'search' && query.length > 1) {
      const t = setTimeout(fetchTracks, 400);
      return () => clearTimeout(t);
    }
  }, [query, mode, fetchTracks]);

  const filtered = tracks
    .filter(t => t.bpm >= bpmRange[0] && t.bpm <= bpmRange[1])
    .filter(t => !keyFilter || t.key === keyFilter)
    .filter(t => t.energy >= energyRange[0] && t.energy <= energyRange[1])
    .sort((a, b) => {
      if (sortBy === 'compatibility') return (b.compatible ? 1 : 0) - (a.compatible ? 1 : 0);
      if (sortBy === 'bpm') return a.bpm - b.bpm;
      if (sortBy === 'key') return a.key.localeCompare(b.key);
      if (sortBy === 'energy') return b.energy - a.energy;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="flex h-full flex-col rounded-2xl bg-card border border-white/5">
      {/* Header */}
      <div className="border-b border-white/5 p-4">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value) setMode('search'); }}
          placeholder="Search tracks…"
          className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:ring-1 focus:ring-golden/50"
        />
        <div className="mt-3 flex gap-2">
          {(['library', 'search'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === m ? 'bg-golden/20 text-golden' : 'text-cream/40 hover:text-cream/60'}`}>
              {m === 'library' ? 'My Library' : 'Search Spotify'}
            </button>
          ))}
          <button onClick={() => setShowFilters(!showFilters)} className={`ml-auto rounded-lg px-3 py-1.5 text-xs ${showFilters ? 'bg-purple/20 text-purple' : 'text-cream/40 hover:text-cream/60'}`}>
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3 rounded-xl bg-white/5 p-3">
            <div>
              <label className="text-xs text-cream/40">BPM: {bpmRange[0]}–{bpmRange[1]}</label>
              <div className="flex gap-2 mt-1">
                <input type="range" min={60} max={200} value={bpmRange[0]} onChange={e => setBpmRange([+e.target.value, bpmRange[1]])} className="flex-1 accent-golden" />
                <input type="range" min={60} max={200} value={bpmRange[1]} onChange={e => setBpmRange([bpmRange[0], +e.target.value])} className="flex-1 accent-golden" />
              </div>
            </div>
            <div>
              <label className="text-xs text-cream/40">Key</label>
              <select value={keyFilter} onChange={e => setKeyFilter(e.target.value)} className="mt-1 w-full rounded-lg bg-bg px-3 py-1.5 text-sm text-cream">
                <option value="">All Keys</option>
                {CAMELOT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cream/40">Energy: {energyRange[0]}–{energyRange[1]}</label>
              <div className="flex gap-2 mt-1">
                <input type="range" min={0} max={100} value={energyRange[0]} onChange={e => setEnergyRange([+e.target.value, energyRange[1]])} className="flex-1 accent-coral" />
                <input type="range" min={0} max={100} value={energyRange[1]} onChange={e => setEnergyRange([energyRange[0], +e.target.value])} className="flex-1 accent-coral" />
              </div>
            </div>
          </div>
        )}

        {/* Sort */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {SORT_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setSortBy(s.value)} className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition-colors ${sortBy === s.value ? 'bg-coral/20 text-coral' : 'text-cream/30 hover:text-cream/50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-golden border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-cream/30">No tracks found</p>
        ) : (
          filtered.map(track => (
            <div key={track.id} className="group flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors">
              <Image src={track.artwork_url} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-cream">{track.title}</p>
                  {track.compatible && <span className="shrink-0 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">Compatible</span>}
                </div>
                <p className="truncate text-xs text-cream/40">{track.artist}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cream/30">
                <span>{track.bpm}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5">{track.key}</span>
                <div className="h-1.5 w-10 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-golden to-coral" style={{ width: `${track.energy}%` }} />
                </div>
              </div>
              <button onClick={() => onAddTrack(track)} className="shrink-0 rounded-lg bg-golden/10 p-1.5 text-golden opacity-0 group-hover:opacity-100 hover:bg-golden/20 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
