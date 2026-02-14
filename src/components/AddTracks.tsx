'use client';

export interface SuggestedTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  camelot: string;
  isMatch: boolean;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
}

interface AddTracksProps {
  suggestions: SuggestedTrack[];
  onAdd?: (id: string) => void;
}

export default function AddTracks({ suggestions, onAdd }: AddTracksProps) {
  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-cream font-serif text-lg">Add Tracks</h3>
        <button className="text-golden text-sm font-medium">
          Browse →
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {suggestions.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 py-2.5 px-2"
          >
            {/* Art */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})`,
              }}
            >
              {t.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-cream text-sm truncate">{t.title}</p>
                {t.isMatch && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    MATCH
                  </span>
                )}
              </div>
              <p className="text-neutral-400 text-xs truncate">
                {t.artist} · <span className="text-coral">{t.bpm}</span> · <span className="text-mauve">{t.camelot}</span>
              </p>
            </div>

            {/* Add button */}
            <button
              onClick={() => onAdd?.(t.id)}
              className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-white text-lg flex-shrink-0 active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
