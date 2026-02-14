// ============================================================
// MixMaven — Shared TypeScript Types
// ============================================================

/** Camelot code string, e.g. "7A" or "11B" */
export type CamelotCode = string;

/** Spotify audio features for a track */
export interface AudioFeatures {
  id: string;
  tempo: number;           // BPM
  key: number;             // 0-11 (C, C#, D … B)
  mode: number;            // 0 = minor, 1 = major
  energy: number;          // 0.0 – 1.0
  danceability: number;
  valence: number;
  loudness: number;
  duration_ms: number;
  time_signature: number;
}

/** Minimal Spotify track representation */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string; width: number; height: number }[] };
  uri: string;
  duration_ms: number;
  preview_url: string | null;
}

/** A track enriched with mix-relevant data */
export interface MixTrack {
  track: SpotifyTrack;
  audio: AudioFeatures;
  camelot: CamelotCode;
  bpm: number;
  energy: number;
}

/** Transition quality between two tracks */
export interface TransitionScore {
  score: number;       // 0-100
  label: 'Perfect' | 'Smooth' | 'Workable' | 'Tricky' | 'Clash';
  color: 'green' | 'yellow' | 'red';
  details: string;
}

/** A complete mix / set */
export interface Mix {
  id: string;
  name: string;
  tracks: MixTrack[];
  transitions: TransitionScore[];
  flowScore: number;   // 0.0 – 5.0
  createdAt: string;
}

/** Spotify OAuth tokens */
export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/** Spotify user profile */
export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  country: string;
  product: string;
}

/** Spotify paged response */
export interface SpotifyPaged<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}
