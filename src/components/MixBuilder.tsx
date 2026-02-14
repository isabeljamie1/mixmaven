'use client';

import { useState, useCallback } from 'react';
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
import { getTransitionScore } from '../../lib/camelot';
import type { MixTrack } from '../../lib/types';

// ── Mock Data ──────────────────────────────────────────────

const MOCK_TRACKS: TrackRowData[] = [
  { id: '1', title: 'Need U (100%)', artist: 'Duke Dumont', bpm: 120, camelot: '5A', emoji: '🎧', gradientFrom: '#6B2D7B', gradientTo: '#C664A0', durationMs: 234000 },
  { id: '2', title: 'Show Me Love', artist: 'Robin S', bpm: 122, camelot: '7A', emoji: '💜', gradientFrom: '#E45B6C', gradientTo: '#F08A5D', durationMs: 213000 },
  { id: '3', title: 'Finally', artist: 'CeCe Peniston', bpm: 123, camelot: '7B', emoji: '🌟', gradientFrom: '#E8A854', gradientTo: '#F08A5D', durationMs: 228000 },
  { id: '4', title: 'Music Sounds Better With You', artist: 'Stardust', bpm: 126, camelot: '6A', emoji: '✨', gradientFrom: '#C664A0', gradientTo: '#6B2D7B', durationMs: 273000 },
];

const SUGGESTED: SuggestedTrack[] = [
  { id: 's1', title: 'Ride It', artist: 'Regard', bpm: 124, camelot: '8A', isMatch: true, emoji: '🎵', gradientFrom: '#34D399', gradientTo: '#6B2D7B' },
  { id: 's2', title: 'Cola', artist: 'CamelPhat', bpm: 124, camelot: '7A', isMatch: true, emoji: '🥤', gradientFrom: '#F08A5D', gradientTo: '#E45B6C' },
  { id: 's3', title: 'Say My Name', artist: "Destiny's Child", bpm: 104, camelot: '4A', isMatch: false, emoji: '💫', gradientFrom: '#E8A854', gradientTo: '#E45B6C' },
];

// Helper to build a minimal MixTrack for scoring
function toMixTrack(t: TrackRowData): MixTrack {
  return {
    track: { id: t.id, name: t.title, artists: [{ id: '', name: t.artist }], album: { id: '', name: '', images: [] }, uri: '', duration_ms: t.durationMs, preview_url: null },
    audio: { id: t.id, tempo: t.bpm, key: 0, mode: 0, energy: 0.7, danceability: 0.7, valence: 0.5, loudness: -6, duration_ms: t.durationMs, time_signature: 4 },
    camelot: t.camelot,
    bpm: t.bpm,
    energy: 0.7,
  };
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ── Component ──────────────────────────────────────────────

export default function MixBuilder() {
  const [tracks, setTracks] = useState<TrackRowData[]>(MOCK_TRACKS);
  const [title, setTitle] = useState('Friday Night Vibes');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTracks((prev) => {
        const oldIdx = prev.findIndex((t) => t.id === active.id);
        const newIdx = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const handleRemove = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  // Compute transitions
  const transitions = tracks.slice(0, -1).map((t, i) => {
    const next = tracks[i + 1];
    const score = getTransitionScore(toMixTrack(t), toMixTrack(next));
    return { ...score, keyFrom: t.camelot, keyTo: next.camelot, bpmDiff: Math.round(next.bpm - t.bpm) };
  });

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-cream font-serif text-2xl font-normal outline-none flex-1 mr-3"
              spellCheck={false}
            />
            <button className="bg-coral text-white text-sm font-semibold px-5 py-2 rounded-full active:scale-95 transition-transform">
              ▶ Play
            </button>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            {tracks.length} tracks · {formatDuration(totalMs)} · by Jamie
          </p>
        </div>

        {/* Track list */}
        <div className="bg-card rounded-xl mx-3 overflow-hidden">
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
        </div>

        {/* Add Tracks */}
        <AddTracks suggestions={SUGGESTED} />
      </div>

      <BottomNav active="build" />
    </div>
  );
}
