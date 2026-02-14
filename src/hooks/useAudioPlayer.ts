'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  preview_url: string;
  artwork?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
}

const CROSSFADE_DURATION = 3; // seconds before end to start crossfade

export function useAudioPlayer(tracks: Track[]) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTrackIndex: 1, // Start on track 2 (Show Me Love)
    currentTime: 0,
    duration: 30,
  });

  const audioA = useRef<HTMLAudioElement | null>(null);
  const audioB = useRef<HTMLAudioElement | null>(null);
  const activeAudio = useRef<'A' | 'B'>('A');
  const rafRef = useRef<number>(0);
  const crossfading = useRef(false);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioA.current = new Audio();
    audioB.current = new Audio();
    audioA.current.volume = 1;
    audioB.current.volume = 0;

    return () => {
      audioA.current?.pause();
      audioB.current?.pause();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getActive = useCallback(() => {
    return activeAudio.current === 'A' ? audioA.current : audioB.current;
  }, []);

  const getInactive = useCallback(() => {
    return activeAudio.current === 'A' ? audioB.current : audioA.current;
  }, []);

  // Update time via rAF
  const tick = useCallback(() => {
    const audio = getActive();
    if (audio && !audio.paused) {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 30;

      setState(prev => ({ ...prev, currentTime, duration }));

      // Crossfade logic
      const timeLeft = duration - currentTime;
      if (timeLeft <= CROSSFADE_DURATION && timeLeft > 0 && !crossfading.current) {
        const nextIdx = state.currentTrackIndex + 1;
        if (nextIdx < tracks.length && tracks[nextIdx].preview_url) {
          crossfading.current = true;
          const inactive = getInactive();
          if (inactive) {
            inactive.src = tracks[nextIdx].preview_url;
            inactive.volume = 0;
            inactive.play().catch(() => {});
          }
        }
      }

      // Adjust volumes during crossfade
      if (crossfading.current) {
        const audio = getActive();
        const inactive = getInactive();
        if (audio && inactive) {
          const timeLeft = (audio.duration || 30) - audio.currentTime;
          const fadeProgress = Math.max(0, 1 - timeLeft / CROSSFADE_DURATION);
          audio.volume = 1 - fadeProgress;
          inactive.volume = fadeProgress;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }
  }, [getActive, getInactive, state.currentTrackIndex, tracks]);

  const loadAndPlay = useCallback((index: number) => {
    const track = tracks[index];
    if (!track) return;

    const audio = getActive();
    if (!audio) return;

    crossfading.current = false;
    audio.volume = 1;
    getInactive()!.pause();
    getInactive()!.volume = 0;

    if (track.preview_url) {
      audio.src = track.preview_url;
      audio.play().catch(() => {});
      setState(prev => ({ ...prev, currentTrackIndex: index, isPlaying: true, currentTime: 0 }));
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setState(prev => ({ ...prev, currentTrackIndex: index, isPlaying: false, currentTime: 0 }));
    }
  }, [tracks, getActive, getInactive, tick]);

  // Handle track end
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;

    const onEnded = () => {
      if (crossfading.current) {
        // Swap active audio
        activeAudio.current = activeAudio.current === 'A' ? 'B' : 'A';
        crossfading.current = false;
        getActive()!.volume = 1;
        const nextIdx = state.currentTrackIndex + 1;
        if (nextIdx < tracks.length) {
          setState(prev => ({ ...prev, currentTrackIndex: nextIdx }));
          rafRef.current = requestAnimationFrame(tick);
        }
      } else {
        // Simple advance
        const nextIdx = state.currentTrackIndex + 1;
        if (nextIdx < tracks.length) {
          loadAndPlay(nextIdx);
        } else {
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [getActive, state.currentTrackIndex, tracks, tick, loadAndPlay]);

  const play = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    if (audio.src) {
      audio.play().catch(() => {});
    } else {
      loadAndPlay(state.currentTrackIndex);
      return;
    }
    setState(prev => ({ ...prev, isPlaying: true }));
    rafRef.current = requestAnimationFrame(tick);
  }, [getActive, loadAndPlay, state.currentTrackIndex, tick]);

  const pause = useCallback(() => {
    getActive()?.pause();
    getInactive()?.pause();
    cancelAnimationFrame(rafRef.current);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [getActive, getInactive]);

  const next = useCallback(() => {
    const nextIdx = state.currentTrackIndex + 1;
    if (nextIdx < tracks.length) loadAndPlay(nextIdx);
  }, [state.currentTrackIndex, tracks.length, loadAndPlay]);

  const previous = useCallback(() => {
    const prevIdx = state.currentTrackIndex - 1;
    if (prevIdx >= 0) loadAndPlay(prevIdx);
  }, [state.currentTrackIndex, loadAndPlay]);

  const seekTo = useCallback((time: number) => {
    const audio = getActive();
    if (audio) {
      audio.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, [getActive]);

  return {
    ...state,
    play,
    pause,
    next,
    previous,
    seekTo,
    currentTrack: tracks[state.currentTrackIndex] || null,
  };
}
