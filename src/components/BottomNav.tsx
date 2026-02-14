'use client';

const TABS = [
  { label: 'Build', icon: '🎛', id: 'build' },
  { label: 'Play', icon: '▶', id: 'play' },
  { label: 'Share', icon: '↗', id: 'share' },
  { label: 'Profile', icon: '👤', id: 'profile' },
] as const;

interface BottomNavProps {
  active?: string;
  onSelect?: (id: string) => void;
}

export default function BottomNav({ active = 'build', onSelect }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-neutral-800 pb-[env(safe-area-inset-bottom)] md:hidden z-50">
      <div className="max-w-[430px] mx-auto flex">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect?.(tab.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[44px] transition-colors ${
                isActive ? 'text-coral' : 'text-neutral-500'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
