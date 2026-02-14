// ============================================================
// MixMaven — Spotify API Client
// Pure fetch, no SDK. Includes rate-limit retry logic.
// ============================================================

import type {
  SpotifyTokens,
  SpotifyUserProfile,
  SpotifyTrack,
  AudioFeatures,
  SpotifyPaged,
} from './types';

// --------------- Config ---------------

const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

const SCOPES = [
  'user-library-read',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
].join(' ');

const MAX_RETRIES = 3;

// --------------- Helpers ---------------

interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

let _config: SpotifyConfig | null = null;

/** Call once at startup with your Spotify app credentials */
export function configure(cfg: SpotifyConfig) {
  _config = cfg;
}

function cfg(): SpotifyConfig {
  if (!_config) throw new Error('Call spotify.configure() before using the client');
  return _config;
}

/** Fetch with automatic retry on 429 (rate limit) */
async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, init);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Spotify ${res.status}: ${body}`);
    }

    return (await res.json()) as T;
  }
  throw new Error('Spotify rate limit: max retries exceeded');
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
}

// --------------- Auth ---------------

/** Generate the Spotify OAuth authorization URL */
export function getAuthUrl(state?: string): string {
  const { clientId, redirectUri } = cfg();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    ...(state ? { state } : {}),
  });
  return `${SPOTIFY_AUTH}?${params}`;
}

/** Exchange an authorization code for tokens */
export async function handleCallback(code: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret, redirectUri } = cfg();
  return apiFetch<SpotifyTokens>(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
}

/** Refresh an expired access token */
export async function refreshToken(rt: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret } = cfg();
  return apiFetch<SpotifyTokens>(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rt }),
  });
}

// --------------- User ---------------

export async function getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  return apiFetch<SpotifyUserProfile>(`${SPOTIFY_API}/me`, {
    headers: authHeaders(accessToken),
  });
}

// --------------- Tracks ---------------

export async function getSavedTracks(
  accessToken: string,
  offset = 0,
  limit = 50,
): Promise<SpotifyPaged<{ added_at: string; track: SpotifyTrack }>> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  return apiFetch(`${SPOTIFY_API}/me/tracks?${params}`, {
    headers: authHeaders(accessToken),
  });
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  offset = 0,
  limit = 100,
): Promise<SpotifyPaged<{ added_at: string; track: SpotifyTrack }>> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  return apiFetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks?${params}`, {
    headers: authHeaders(accessToken),
  });
}

/** Batch-fetch audio features (max 100 IDs per call, handled automatically) */
export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[],
): Promise<AudioFeatures[]> {
  const results: AudioFeatures[] = [];
  // Spotify allows max 100 IDs per request
  for (let i = 0; i < trackIds.length; i += 100) {
    const batch = trackIds.slice(i, i + 100);
    const data = await apiFetch<{ audio_features: (AudioFeatures | null)[] }>(
      `${SPOTIFY_API}/audio-features?ids=${batch.join(',')}`,
      { headers: authHeaders(accessToken) },
    );
    for (const f of data.audio_features) {
      if (f) results.push(f);
    }
  }
  return results;
}

export async function searchTracks(
  accessToken: string,
  query: string,
  limit = 20,
): Promise<SpotifyPaged<SpotifyTrack>> {
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  const data = await apiFetch<{ tracks: SpotifyPaged<SpotifyTrack> }>(
    `${SPOTIFY_API}/search?${params}`,
    { headers: authHeaders(accessToken) },
  );
  return data.tracks;
}

// --------------- Playlists ---------------

/** Create a playlist and populate it with track URIs */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  trackUris: string[],
  description = 'Built with MixMaven 🎧',
): Promise<{ id: string; external_urls: { spotify: string } }> {
  // Create the playlist
  const playlist = await apiFetch<{ id: string; external_urls: { spotify: string } }>(
    `${SPOTIFY_API}/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ name, description, public: false }),
    },
  );

  // Add tracks in batches of 100
  for (let i = 0; i < trackUris.length; i += 100) {
    await apiFetch(`${SPOTIFY_API}/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ uris: trackUris.slice(i, i + 100) }),
    });
  }

  return playlist;
}
