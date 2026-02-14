'use client';

import { useState } from 'react';
import ShareCard from './ShareCard';
import BottomNav from './BottomNav';
import { generateShareUrl, nativeShare, copyToClipboard } from '@/lib/share';

interface ShareScreenProps {
  mixTitle: string;
  author: string;
  username: string;
  slug: string;
  trackCount: number;
  duration: string;
  tracks: { emoji: string; gradientFrom: string; gradientTo: string }[];
  flowScore: number;
  avgBpm: number;
  smoothTransitions: string;
  onBack?: () => void;
}

export default function ShareScreen({
  mixTitle,
  author,
  username,
  slug,
  trackCount,
  duration,
  tracks,
  flowScore,
  avgBpm,
  smoothTransitions,
  onBack,
}: ShareScreenProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = generateShareUrl(username, slug);

  const handleShareLink = () => {
    nativeShare(
      `${mixTitle} — a mix by ${author}`,
      `${trackCount} tracks · ${duration} · Check it out!`,
      shareUrl
    );
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-[430px] mx-auto px-4">
        {/* Header */}
        <header className="flex items-center gap-3 py-4">
          <button onClick={onBack} className="text-cream text-xl p-1">
            ←
          </button>
          <h1 className="text-cream text-sm font-semibold tracking-widest uppercase">
            Share
          </h1>
        </header>

        {/* Share Card */}
        <ShareCard
          title={mixTitle}
          author={author}
          trackCount={trackCount}
          duration={duration}
          tracks={tracks}
          flowScore={flowScore}
          avgBpm={avgBpm}
          smoothTransitions={smoothTransitions}
        />

        {/* Share CTA */}
        <div className="mt-8 mb-6">
          <h3 className="text-cream text-lg font-semibold">Share Your Mix</h3>
          <p className="text-neutral-400 text-sm mt-1">
            Friends can listen, remix, or fork it
          </p>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleShareLink}
            className="w-full py-3.5 rounded-xl bg-coral text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            📤 Share Link
          </button>

          <button className="w-full py-3.5 rounded-xl bg-[#1DB954] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            🎵 Save as Spotify Playlist
          </button>

          <button className="w-full py-3.5 rounded-xl bg-card text-cream font-semibold text-sm flex items-center justify-center gap-2 border border-neutral-800 active:scale-[0.98] transition-transform">
            📱 Instagram Story
          </button>

          <button className="w-full py-3.5 rounded-xl bg-card text-cream font-semibold text-sm flex items-center justify-center gap-2 border border-neutral-800 active:scale-[0.98] transition-transform">
            💬 iMessage
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3.5 rounded-xl bg-transparent text-neutral-400 font-semibold text-sm flex flex-col items-center justify-center gap-1 border border-neutral-700 active:scale-[0.98] transition-transform"
          >
            <span>{copied ? '✅ Copied!' : '🔗 Copy Link'}</span>
            <span className="text-[11px] text-neutral-600 font-normal">
              mixmaven.io/{username[0]}/{slug}
            </span>
          </button>
        </div>
      </div>

      <BottomNav active="share" />
    </div>
  );
}
