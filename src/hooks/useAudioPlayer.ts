'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  preview_url: string | null;
  album_art_url?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
}

const CROSSFADE_DURATION = 3;

export function useAudioPlayer(tracks: Track[]) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTrackIndex: 0,
    currentTime: 0,
    duration: 30,
    volume: 0.8,
  });

  const audioA = useRef<HTMLAudioElement | null>(null);
  const audioB = useRef<HTMLAudioElement | null>(null);
  const activeAudio = useRef<'A' | 'B'>('A');
  const rafRef = useRef<number>(0);
  const crossfading = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioA.current = new Audio();
    audioB.current = new Audio();
    audioA.current.crossOrigin = 'anonymous';
    audioB.current.crossOrigin = 'anonymous';
    audioA.current.volume = state.volume;
    audioB.current.volume = 0;

    return () => {
      audioA.current?.pause();
      audioB.current?.pause();
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getActive = useCallback(() => {
    return activeAudio.current === 'A' ? audioA.current : audioB.current;
  }, []);

  const getInactive = useCallback(() => {
    return activeAudio.current === 'A' ? audioB.current : audioA.current;
  }, []);

  const tick = useCallback(() => {
    const audio = getActive();
    if (audio && !audio.paused) {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 30;

      setState(prev => ({ ...prev, currentTime, duration }));

      const timeLeft = duration - currentTime;
      if (timeLeft <= CROSSFADE_DURATION && timeLeft > 0 && !crossfading.current) {
        const nextIdx = state.currentTrackIndex + 1;
        if (nextIdx < tracks.length && tracks[nextIdx].preview_url) {
          crossfading.current = true;
          const inactive = getInactive();
          if (inactive) {
            inactive.src = tracks[nextIdx].preview_url!;
            inactive.volume = 0;
            inactive.play().catch(() => {});
          }
        }
      }

      if (crossfading.current) {
        const active = getActive();
        const inactive = getInactive();
        if (active && inactive) {
          const tl = (active.duration || 30) - active.currentTime;
          const fadeProgress = Math.max(0, 1 - tl / CROSSFADE_DURATION);
          active.volume = state.volume * (1 - fadeProgress);
          inactive.volume = state.volume * fadeProgress;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }
  }, [getActive, getInactive, state.currentTrackIndex, state.volume, tracks]);

  const loadAndPlay = useCallback((index: number) => {
    const track = tracks[index];
    if (!track) return;

    const audio = getActive();
    if (!audio) return;

    crossfading.current = false;
    audio.volume = state.volume;
    const inactive = getInactive();
    if (inactive) {
      inactive.pause();
      inactive.volume = 0;
    }

    if (track.preview_url) {
      audio.src = track.preview_url;
      audio.play().catch(() => {});
      setState(prev => ({ ...prev, currentTrackIndex: index, isPlaying: true, currentTime: 0 }));
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setState(prev => ({ ...prev, currentTrackIndex: index, isPlaying: false, currentTime: 0 }));
    }
  }, [tracks, getActive, getInactive, state.volume, tick]);

  useEffect(() => {
    const audio = getActive();
    if (!audio) return;

    const onEnded = () => {
      if (crossfading.current) {
        activeAudio.current = activeAudio.current === 'A' ? 'B' : 'A';
        crossfading.current = false;
        const active = getActive();
        if (active) active.volume = state.volume;
        const nextIdx = state.currentTrackIndex + 1;
        if (nextIdx < tracks.length) {
          setState(prev => ({ ...prev, currentTrackIndex: nextIdx }));
          rafRef.current = requestAnimationFrame(tick);
        }
      } else {
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
  }, [getActive, state.currentTrackIndex, state.volume, tracks, tick, loadAndPlay]);

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

  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    setState(prev => ({ ...prev, volume: v }));
    const audio = getActive();
    if (audio && !crossfading.current) audio.volume = v;
  }, [getActive]);

  return {
    ...state,
    play,
    pause,
    next,
    previous,
    seekTo,
    setVolume,
    currentTrack: tracks[state.currentTrackIndex] || null,
    hasPreview: !!(tracks[state.currentTrackIndex]?.preview_url),
  };
}
