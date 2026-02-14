'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import TrackRow, { type TrackRowData } from './TrackRow';
import TransitionIndicator from './TransitionIndicator';
import AddTracks, { type SuggestedTrack } from './AddTracks';
import BottomNav from './BottomNav';
import ExportButton from './ExportButton';
import { getTransitionScore } from '../../lib/camelot';
import type { MixTrack } from '../../lib/types';

// ── Helpers ────────────────────────────────────────────────

function mixTrackToRowData(mt: MixTrack): TrackRowData {
  const img = mt.track.album.images?.[0]?.url;
  return {
    id: mt.track.id,
    title: mt.track.name,
    artist: mt.track.artists.map(a => a.name).join(', '),
    bpm: mt.bpm,
    camelot: mt.camelot,
    energy: mt.energy,
    albumArt: img,
    durationMs: mt.track.duration_ms,
    uri: mt.track.uri,
  };
}

function toMixTrack(t: TrackRowData): MixTrack {
  return {
    track: { id: t.id, name: t.title, artists: [{ id: '', name: t.artist }], album: { id: '', name: '', images: t.albumArt ? [{ url: t.albumArt, width: 300, height: 300 }] : [] }, uri: t.uri || '', duration_ms: t.durationMs, preview_url: null },
    audio: { id: t.id, tempo: t.bpm, key: 0, mode: 0, energy: t.energy ?? 0.7, danceability: 0.7, valence: 0.5, loudness: -6, duration_ms: t.durationMs, time_signature: 4 },
    camelot: t.camelot,
    bpm: t.bpm,
    energy: t.energy ?? 0.7,
  };
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────

interface MixBuilderProps {
  mixId: string;
  initialTracks?: TrackRowData[];
  initialTitle?: string;
}

// ── Component ──────────────────────────────────────────────

export default function MixBuilder({ mixId, initialTracks, initialTitle }: MixBuilderProps) {
  const [tracks, setTracks] = useState<TrackRowData[]>(initialTracks ?? []);
  const [title, setTitle] = useState(initialTitle ?? 'Untitled Mix');
  const [library, setLibrary] = useState<SuggestedTrack[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedTrack[]>([]);
  const [loaded, setLoaded] = useState(!!initialTracks);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Fetch mix data on mount
  useEffect(() => {
    if (initialTracks) return;
    (async () => {
      try {
        const res = await fetch(`/api/mixes/${mixId}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.name ?? 'Untitled Mix');
          setTracks((data.tracks ?? []).map(mixTrackToRowData));
        }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [mixId, initialTracks]);

  // Fetch library
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/spotify/library');
        if (res.ok) {
          const data = await res.json();
          setLibrary(data.tracks ?? []);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Fetch smart suggestions when last track changes
  const lastTrack = tracks.length > 0 ? tracks[tracks.length - 1] : null;
  useEffect(() => {
    if (!lastTrack) { setSuggestions([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/spotify/search?q=&camelot=${lastTrack.camelot}&bpm=${lastTrack.bpm}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.tracks ?? []);
        }
      } catch { /* ignore */ }
    })();
  }, [lastTrack?.id]);

  // Auto-save (debounced 2sec)
  const autoSave = useCallback((newTracks: TrackRowData[], newTitle: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/mixes/${mixId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newTitle,
            trackIds: newTracks.map(t => t.id),
            trackUris: newTracks.map(t => t.uri),
          }),
        });
      } catch { /* ignore */ }
    }, 2000);
  }, [mixId]);

  const updateTracks = useCallback((fn: (prev: TrackRowData[]) => TrackRowData[]) => {
    setTracks(prev => {
      const next = fn(prev);
      autoSave(next, title);
      return next;
    });
  }, [autoSave, title]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateTracks((prev) => {
        const oldIdx = prev.findIndex((t) => t.id === active.id);
        const newIdx = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, [updateTracks]);

  const handleRemove = useCallback((id: string) => {
    updateTracks((prev) => prev.filter((t) => t.id !== id));
  }, [updateTracks]);

  const handleAddTrack = useCallback((suggested: SuggestedTrack) => {
    const newTrack: TrackRowData = {
      id: suggested.id,
      title: suggested.title,
      artist: suggested.artist,
      bpm: suggested.bpm,
      camelot: suggested.camelot,
      energy: suggested.energy ?? 0.7,
      albumArt: suggested.albumArt,
      emoji: suggested.emoji,
      gradientFrom: suggested.gradientFrom,
      gradientTo: suggested.gradientTo,
      durationMs: 0,
      uri: suggested.uri,
    };
    updateTracks((prev) => [...prev, newTrack]);
  }, [updateTracks]);

  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  // Compute transitions
  const transitions = tracks.slice(0, -1).map((t, i) => {
    const next = tracks[i + 1];
    const score = getTransitionScore(toMixTrack(t), toMixTrack(next));
    return { ...score, keyFrom: t.camelot, keyTo: next.camelot, bpmDiff: Math.round(next.bpm - t.bpm) };
  });

  // Mark library tracks as compatible with last track
  const libraryWithMatch = library.map(t => ({
    ...t,
    isMatch: lastTrack ? t.camelot === lastTrack.camelot : false,
  }));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-golden/30 border-t-golden rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between gap-2">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                autoSave(tracks, e.target.value);
              }}
              className="bg-transparent text-cream font-serif text-2xl font-normal outline-none flex-1 mr-2"
              spellCheck={false}
            />
            <ExportButton mixId={mixId} mixName={title} />
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            {tracks.length} tracks · {formatDuration(totalMs)}
          </p>
        </div>

        {/* Track list */}
        <div className="bg-card rounded-xl mx-3 overflow-y-auto max-h-[60vh] overscroll-contain">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tracks.map((track, i) => (
                <div key={track.id}>
                  <TrackRow track={track} index={i} onRemove={handleRemove} />
                  {i < tracks.length - 1 && transitions[i] && (
                    <TransitionIndicator
                      label={transitions[i].label}
                      keyFrom={transitions[i].keyFrom}
                      keyTo={transitions[i].keyTo}
                      bpmDiff={transitions[i].bpmDiff}
                      color={transitions[i].color}
                    />
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>
          {tracks.length === 0 && (
            <p className="text-neutral-500 text-sm text-center py-8">
              Add tracks to start building your mix
            </p>
          )}
        </div>

        {/* Smart Suggest */}
        {suggestions.length > 0 && (
          <div className="mt-6 px-4">
            <h3 className="text-cream font-serif text-lg mb-3">
              ✨ Smart Suggest
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestions.slice(0, 6).map(s => (
                <button
                  key={s.id}
                  onClick={() => handleAddTrack(s)}
                  className="flex-shrink-0 w-28 bg-card rounded-xl p-2 active:scale-95 transition-transform"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2">
                    {s.albumArt ? (
                      <img src={s.albumArt} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mauve to-coral flex items-center justify-center text-xl">
                        🎵
                      </div>
                    )}
                  </div>
                  <p className="text-cream text-xs truncate">{s.title}</p>
                  <p className="text-neutral-400 text-[10px] truncate">{s.artist}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] text-coral">{s.bpm}</span>
                    <span className="text-[10px] text-mauve">{s.camelot}</span>
                    {s.isMatch && (
                      <span className="text-[9px] font-bold text-emerald-400">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Tracks */}
        <AddTracks
          suggestions={suggestions}
          libraryTracks={libraryWithMatch}
          lastTrack={lastTrack}
          onAdd={handleAddTrack}
        />
      </div>

      <BottomNav active="build" />
    </div>
  );
}
