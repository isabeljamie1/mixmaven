'use client';

import ShareScreen from '@/components/ShareScreen';
import { useRouter } from 'next/navigation';

const MOCK_TRACKS = [
  { emoji: '🌅', gradientFrom: '#F08A5D', gradientTo: '#E45B6C' },
  { emoji: '🔥', gradientFrom: '#E45B6C', gradientTo: '#C664A0' },
  { emoji: '💜', gradientFrom: '#C664A0', gradientTo: '#6B2D7B' },
  { emoji: '🌊', gradientFrom: '#6B2D7B', gradientTo: '#E8A854' },
];

export default function SharePage() {
  const router = useRouter();

  return (
    <ShareScreen
      mixTitle="Friday Heat"
      author="Jamie"
      username="jamie"
      slug="friday-heat"
      trackCount={4}
      duration="15:48"
      tracks={MOCK_TRACKS}
      flowScore={4.8}
      avgBpm={122}
      smoothTransitions="3/4"
      onBack={() => router.back()}
    />
  );
}
