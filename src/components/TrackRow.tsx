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
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  durationMs: number;
}

interface TrackRowProps {
  track: TrackRowData;
  index: number;
  onRemove?: (id: string) => void;
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

      {/* Album art placeholder */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${track.gradientFrom}, ${track.gradientTo})`,
        }}
      >
        {track.emoji}
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

      {/* Delete button (long press) */}
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
