'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { MixTrack } from '@/lib/types';

const CROSSFADE_MS = 3000;

export function useSpotifyPlayer(playlist: MixTrack[] = []) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentTrack = currentIndex >= 0 && currentIndex < playlist.length
    ? playlist[currentIndex]
    : null;

  const cleanup = useCallback(() => {
    clearInterval(progressTimer.current);
    clearTimeout(crossfadeTimer.current);
    audioRef.current?.pause();
    nextAudioRef.current?.pause();
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress(audio.currentTime * 1000);
    }, 200);
  }, []);

  const playIndex = useCallback((index: number) => {
    if (index < 0 || index >= playlist.length) return;
    const track = playlist[index];
    if (!track.track.preview_url) return;

    cleanup();

    const audio = new Audio(track.track.preview_url);
    audioRef.current = audio;
    setCurrentIndex(index);
    setDuration(30000); // preview is always ~30s
    setProgress(0);
    setIsPlaying(true);

    audio.play();
    startProgressTracking(audio);

    // Set up crossfade near end
    const nextIdx = index + 1;
    if (nextIdx < playlist.length && playlist[nextIdx].track.preview_url) {
      crossfadeTimer.current = setTimeout(() => {
        // Start next track quietly
        const nextAudio = new Audio(playlist[nextIdx].track.preview_url!);
        nextAudioRef.current = nextAudio;
        nextAudio.volume = 0;
        nextAudio.play();

        // Crossfade over CROSSFADE_MS
        const steps = 20;
        const interval = CROSSFADE_MS / steps;
        let step = 0;
        const fadeInterval = setInterval(() => {
          step++;
          const ratio = step / steps;
          audio.volume = Math.max(0, 1 - ratio);
          nextAudio.volume = Math.min(1, ratio);
          if (step >= steps) {
            clearInterval(fadeInterval);
            audio.pause();
            audioRef.current = nextAudio;
            nextAudioRef.current = null;
            setCurrentIndex(nextIdx);
            setProgress(0);
            startProgressTracking(nextAudio);
          }
        }, interval);
      }, (30000 - CROSSFADE_MS));
    }

    audio.onended = () => {
      if (nextAudioRef.current) return; // crossfade handles it
      if (nextIdx < playlist.length) {
        playIndex(nextIdx);
      } else {
        setIsPlaying(false);
        cleanup();
      }
    };
  }, [playlist, cleanup, startProgressTracking]);

  const play = useCallback((track?: MixTrack) => {
    if (track) {
      const idx = playlist.findIndex((t) => t.track.id === track.track.id);
      playIndex(idx >= 0 ? idx : 0);
    } else if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      startProgressTracking(audioRef.current);
    }
  }, [playlist, playIndex, isPlaying, startProgressTracking]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    clearInterval(progressTimer.current);
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    cleanup();
    playIndex(currentIndex + 1);
  }, [currentIndex, playIndex, cleanup]);

  const previous = useCallback(() => {
    cleanup();
    playIndex(Math.max(0, currentIndex - 1));
  }, [currentIndex, playIndex, cleanup]);

  const seekTo = useCallback((ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      setProgress(ms);
    }
  }, []);

  return {
    currentTrack, isPlaying, progress, duration, currentIndex,
    play, pause, next, previous, seekTo,
  };
}
