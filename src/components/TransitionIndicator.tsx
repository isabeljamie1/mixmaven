'use client';

interface TransitionIndicatorProps {
  label: string;
  keyFrom: string;
  keyTo: string;
  bpmDiff: number;
  color: 'green' | 'yellow' | 'red';
}

const DOT_COLORS = {
  green: '#34D399',
  yellow: '#FBBF24',
  red: '#F87171',
};

export default function TransitionIndicator({
  label,
  keyFrom,
  keyTo,
  bpmDiff,
  color,
}: TransitionIndicatorProps) {
  const bpmStr = bpmDiff === 0 ? 'same BPM' : `${bpmDiff > 0 ? '+' : ''}${bpmDiff} BPM`;

  return (
    <div className="flex items-center gap-2 pl-[72px] py-1">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: DOT_COLORS[color] }}
      />
      <span className="text-neutral-500 text-[11px]">
        {label} · {keyFrom} → {keyTo} · {bpmStr}
      </span>
    </div>
  );
}
