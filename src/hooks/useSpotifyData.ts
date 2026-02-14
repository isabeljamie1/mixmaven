'use client';

import { useState, useCallback, useRef } from 'react';
import type { MixTrack, SpotifyTrack, AudioFeatures } from '@/lib/types';

interface UseSpotifyDataReturn {
  tracks: MixTrack[];
  searchResults: MixTrack[];
  isLoading: boolean;
  error: string | null;
  fetchLibrary: () => Promise<void>;
  search: (query: string) => Promise<void>;
  fetchPlaylistTracks: (playlistId: string) => Promise<MixTrack[]>;
}

/** Hook for fetching Spotify data via our API routes (which handle tokens server-side) */
export function useSpotifyData(): UseSpotifyDataReturn {
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [searchResults, setSearchResults] = useState<MixTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/spotify/library');
      if (!res.ok) throw new Error(`Failed to fetch library: ${res.status}`);
      const data: MixTrack[] = await res.json();
      setTracks(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    // Cancel previous search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: MixTrack[] = await res.json();
      setSearchResults(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlaylistTracks = useCallback(async (playlistId: string): Promise<MixTrack[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/spotify/library?playlist=${encodeURIComponent(playlistId)}`);
      if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tracks, searchResults, isLoading, error, fetchLibrary, search, fetchPlaylistTracks };
}
