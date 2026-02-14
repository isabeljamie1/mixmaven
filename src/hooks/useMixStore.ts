'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMixFlowScore, getTransitionScore } from '@/lib/camelot';
import type { Mix, MixTrack, TransitionScore } from '@/lib/types';

function buildTransitions(tracks: MixTrack[]): TransitionScore[] {
  const t: TransitionScore[] = [];
  for (let i = 0; i < tracks.length - 1; i++) {
    t.push(getTransitionScore(tracks[i], tracks[i + 1]));
  }
  return t;
}

function buildMix(partial: Partial<Mix> & { tracks: MixTrack[] }): Mix {
  const transitions = buildTransitions(partial.tracks);
  const flowScore = getMixFlowScore(partial.tracks);
  return {
    id: partial.id ?? '',
    name: partial.name ?? 'Untitled Mix',
    tracks: partial.tracks,
    transitions,
    flowScore,
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
}

export function useMixStore() {
  const [mix, setMix] = useState<Mix>(buildMix({ tracks: [] }));
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setTitle = useCallback((name: string) => {
    setMix((m) => ({ ...m, name }));
  }, []);

  const addTrack = useCallback((track: MixTrack) => {
    setMix((m) => buildMix({ ...m, tracks: [...m.tracks, track] }));
  }, []);

  const removeTrack = useCallback((index: number) => {
    setMix((m) => buildMix({ ...m, tracks: m.tracks.filter((_, i) => i !== index) }));
  }, []);

  const reorderTracks = useCallback((from: number, to: number) => {
    setMix((m) => {
      const tracks = [...m.tracks];
      const [moved] = tracks.splice(from, 1);
      tracks.splice(to, 0, moved);
      return buildMix({ ...m, tracks });
    });
  }, []);

  const saveMix = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mix),
      });
      if (!res.ok) throw new Error('Failed to save mix');
      const saved = await res.json();
      setMix((m) => ({ ...m, id: saved.id }));
      return saved.id;
    } finally {
      setIsLoading(false);
    }
  }, [mix]);

  const loadMix = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mixes/${id}`);
      if (!res.ok) throw new Error('Failed to load mix');
      const data = await res.json();
      setMix(buildMix(data));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listMixes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mixes');
      if (!res.ok) throw new Error('Failed to list mixes');
      const data: Mix[] = await res.json();
      setMixes(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMix = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mixes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete mix');
      setMixes((m) => m.filter((x) => x.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    mix, mixes, isLoading,
    setTitle, addTrack, removeTrack, reorderTracks,
    saveMix, loadMix, listMixes, deleteMix,
  };
}
