'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  showBack?: boolean;
  userName?: string;
  avatarUrl?: string;
}

export default function Header({ showBack, userName, avatarUrl }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-lg border-b border-neutral-800/50">
      <div className="max-w-[430px] md:max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: back or logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-cream/70 text-xl"
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <span className="font-serif text-xl md:text-2xl bg-gradient-to-r from-coral via-rose to-mauve bg-clip-text text-transparent">
            MixMaven
          </span>
        </div>

        {/* Right: user */}
        {userName && (
          <div className="flex items-center gap-2">
            <span className="text-cream/60 text-sm hidden sm:block">{userName}</span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full ring-2 ring-coral/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-purple flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
