'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

export interface TrackRowData {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  camelot: string;
  energy: number;
  albumArt?: string;
  emoji?: string;
  gradientFrom?: string;
  gradientTo?: string;
  durationMs: number;
  uri?: string;
}

interface TrackRowProps {
  track: TrackRowData;
  index: number;
  onRemove?: (id: string) => void;
}

function energyColor(energy: number): string {
  if (energy < 0.33) return '#34D399';
  if (energy < 0.66) return '#E8A854';
  return '#FF6B35';
}

export default function TrackRow({ track, index, onRemove }: TrackRowProps) {
  const [showDelete, setShowDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-3 px-2 group"
      onContextMenu={(e) => {
        e.preventDefault();
        setShowDelete(!showDelete);
      }}
    >
      {/* Drag handle */}
      <button
        className="flex flex-col gap-[3px] cursor-grab active:cursor-grabbing p-1 touch-none"
        {...attributes}
        {...listeners}
      >
        <span className="block w-4 h-[2px] bg-neutral-500 rounded" />
        <span className="block w-4 h-[2px] bg-neutral-500 rounded" />
        <span className="block w-4 h-[2px] bg-neutral-500 rounded" />
      </button>

      {/* Track number */}
      <span className="text-neutral-500 text-xs w-4 text-center font-sans">
        {index + 1}
      </span>

      {/* Album art */}
      <div className="relative w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden">
        {track.albumArt ? (
          <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-lg"
            style={{
              background: `linear-gradient(135deg, ${track.gradientFrom || '#6B2D7B'}, ${track.gradientTo || '#C664A0'})`,
            }}
          >
            {track.emoji || '🎵'}
          </div>
        )}
        {/* Energy bar */}
        <div
          className="absolute bottom-0 left-0 h-[3px] rounded-b-lg"
          style={{
            width: `${(track.energy ?? 0.5) * 100}%`,
            backgroundColor: energyColor(track.energy ?? 0.5),
          }}
        />
      </div>

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <p className="text-cream text-sm font-medium truncate">{track.title}</p>
        <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
      </div>

      {/* BPM + Key */}
      <div className="text-right flex-shrink-0">
        <p className="text-coral text-xs font-semibold">{track.bpm}</p>
        <p className="text-mauve text-xs">{track.camelot}</p>
      </div>

      {/* Delete button */}
      {showDelete && (
        <button
          onClick={() => onRemove?.(track.id)}
          className="ml-1 text-rose text-xs bg-rose/10 rounded-lg px-2 py-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
