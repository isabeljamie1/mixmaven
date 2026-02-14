// ============================================================
// MixMaven — Camelot Wheel Engine
// Maps musical keys to the Camelot system and scores transitions.
// ============================================================

import type { MixTrack, TransitionScore, CamelotCode } from './types';

// --------------- Lookup Tables ---------------

// Spotify key (0-11) → Camelot number for minor keys (A)
const MINOR_MAP: Record<number, number> = {
  0: 5,   // C minor  → 5A
  1: 12,  // C# minor → 12A
  2: 7,   // D minor  → 7A
  3: 2,   // D# minor → 2A
  4: 9,   // E minor  → 9A
  5: 4,   // F minor  → 4A
  6: 11,  // F# minor → 11A
  7: 6,   // G minor  → 6A
  8: 1,   // G# minor → 1A
  9: 8,   // A minor  → 8A
  10: 3,  // A# minor → 3A
  11: 10, // B minor  → 10A
};

// Spotify key (0-11) → Camelot number for major keys (B)
const MAJOR_MAP: Record<number, number> = {
  0: 8,   // C major  → 8B
  1: 3,   // C# major → 3B
  2: 10,  // D major  → 10B
  3: 5,   // D# major → 5B
  4: 12,  // E major  → 12B
  5: 1,   // F major  → 1B
  6: 6,   // F# major → 6B
  7: 11,  // G major  → 11B
  8: 4,   // G# major → 4B
  9: 9,   // A major  → 9B
  10: 2,  // A# major → 2B
  11: 7,  // B major  → 7B
};

// --------------- Core Functions ---------------

/** Parse a Camelot code like "7A" into { number, letter } */
function parse(code: CamelotCode): { num: number; letter: 'A' | 'B' } {
  const match = code.match(/^(\d{1,2})([AB])$/);
  if (!match) throw new Error(`Invalid Camelot code: ${code}`);
  return { num: parseInt(match[1], 10), letter: match[2] as 'A' | 'B' };
}

/** Wrap 1-12 on the Camelot wheel */
function wrap(n: number): number {
  return ((n - 1 + 12) % 12) + 1;
}

/** Convert Spotify key + mode to Camelot code */
export function spotifyKeyToCamelot(key: number, mode: number): CamelotCode {
  if (key < 0 || key > 11) throw new Error(`Invalid key: ${key}`);
  const num = mode === 1 ? MAJOR_MAP[key] : MINOR_MAP[key];
  const letter = mode === 1 ? 'B' : 'A';
  return `${num}${letter}`;
}

/** Get all harmonically compatible keys for a given Camelot code */
export function getCompatibleKeys(code: CamelotCode): CamelotCode[] {
  const { num, letter } = parse(code);
  const otherLetter = letter === 'A' ? 'B' : 'A';
  return [
    `${num}${letter}`,             // same (perfect)
    `${wrap(num + 1)}${letter}`,   // +1 adjacent
    `${wrap(num - 1)}${letter}`,   // -1 adjacent
    `${num}${otherLetter}`,        // energy shift (relative major/minor)
  ];
}

// --------------- Transition Scoring ---------------

type KeyRelation = 'perfect' | 'adjacent' | 'energy_shift' | 'distant';

function keyRelation(a: CamelotCode, b: CamelotCode): KeyRelation {
  const pa = parse(a);
  const pb = parse(b);
  if (pa.num === pb.num && pa.letter === pb.letter) return 'perfect';
  if (pa.num === pb.num && pa.letter !== pb.letter) return 'energy_shift';
  if (pa.letter === pb.letter) {
    const dist = Math.min(
      Math.abs(pa.num - pb.num),
      12 - Math.abs(pa.num - pb.num),
    );
    if (dist === 1) return 'adjacent';
  }
  return 'distant';
}

/** Minimum distance on the Camelot wheel (0-6) */
function camelotDistance(a: CamelotCode, b: CamelotCode): number {
  const pa = parse(a);
  const pb = parse(b);
  const numDist = Math.min(Math.abs(pa.num - pb.num), 12 - Math.abs(pa.num - pb.num));
  const letterPenalty = pa.letter !== pb.letter ? 1 : 0;
  return numDist + letterPenalty;
}

function keyScore(a: CamelotCode, b: CamelotCode): number {
  const rel = keyRelation(a, b);
  if (rel === 'perfect') return 100;
  if (rel === 'adjacent') return 80;
  if (rel === 'energy_shift') return 70;
  // Distance-based falloff for distant keys
  const dist = camelotDistance(a, b);
  return Math.max(0, 100 - dist * 15);
}

function bpmScore(bpmA: number, bpmB: number): number {
  const diff = Math.abs(bpmA - bpmB) / Math.max(bpmA, bpmB);
  if (diff === 0) return 100;
  if (diff <= 0.03) return 80;
  if (diff <= 0.06) return 50;
  return Math.max(0, 100 - diff * 300);
}

function energyScore(eA: number, eB: number): number {
  return Math.max(0, 100 - Math.abs(eA - eB) * 200);
}

/** Score the transition between two MixTracks */
export function getTransitionScore(a: MixTrack, b: MixTrack): TransitionScore {
  const ks = keyScore(a.camelot, b.camelot);
  const bs = bpmScore(a.bpm, b.bpm);
  const es = energyScore(a.energy, b.energy);

  const score = Math.round(ks * 0.6 + bs * 0.3 + es * 0.1);

  const label: TransitionScore['label'] =
    score >= 85 ? 'Perfect' :
    score >= 70 ? 'Smooth' :
    score >= 50 ? 'Workable' :
    score >= 30 ? 'Tricky' : 'Clash';

  const color: TransitionScore['color'] =
    score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';

  const bpmDiff = Math.round(b.bpm - a.bpm);
  const bpmStr = bpmDiff === 0 ? 'same BPM' : `${bpmDiff > 0 ? '+' : ''}${bpmDiff} BPM`;
  const details = `Key ${a.camelot}→${b.camelot}, ${bpmStr}`;

  return { score, label, color, details };
}

/** Score an entire mix's flow quality (0.0 – 5.0) */
export function getMixFlowScore(tracks: MixTrack[]): number {
  if (tracks.length < 2) return 5.0;

  let total = 0;
  for (let i = 0; i < tracks.length - 1; i++) {
    total += getTransitionScore(tracks[i], tracks[i + 1]).score;
  }
  const avg = total / (tracks.length - 1); // 0-100
  return Math.round((avg / 20) * 10) / 10;  // scale to 0-5.0, one decimal
}
