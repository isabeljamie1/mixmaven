'use client';

import NowPlaying from '@/components/NowPlaying';
import BottomNav from '@/components/BottomNav';
import { Track } from '@/hooks/useAudioPlayer';

const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Need U (100%)',
    artist: 'Duke Dumont',
    bpm: 120,
    key: '5A',
    preview_url: '',
  },
  {
    id: '2',
    title: 'Show Me Love',
    artist: 'Robin S',
    bpm: 122,
    key: '7A',
    preview_url: '',
  },
  {
    id: '3',
    title: 'Finally',
    artist: 'CeCe Peniston',
    bpm: 123,
    key: '7B',
    preview_url: '',
  },
  {
    id: '4',
    title: 'Music Sounds Better With You',
    artist: 'Stardust',
    bpm: 126,
    key: '6A',
    preview_url: '',
  },
];

export default function PlayPage() {
  return (
    <div className="max-w-[430px] mx-auto relative">
      <NowPlaying tracks={MOCK_TRACKS} />
      <BottomNav active="play" />
    </div>
  );
}
