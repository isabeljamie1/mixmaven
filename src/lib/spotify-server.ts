// ============================================================
// MixMaven — Server-side Spotify token helpers
// Used by API routes to get/refresh tokens for a user.
// ============================================================

import { createClient } from './supabase/server';
import { configure, refreshToken } from './spotify';
import type { SpotifyTokens } from './types';

// Ensure Spotify client is configured
configure({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
});

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  token_expires_at: number; // epoch ms
  spotify_id: string;
}

/** Read Spotify tokens for a user from Supabase profiles table */
export async function getSpotifyTokensForUser(spotifyId: string): Promise<StoredTokens | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('spotify_id, access_token, refresh_token, token_expires_at')
    .eq('spotify_id', spotifyId)
    .single();

  if (error || !data) return null;
  return data as StoredTokens;
}

/** Check if tokens are expired; if so refresh and update DB. Returns valid access_token. */
export async function refreshIfExpired(tokens: StoredTokens): Promise<string> {
  const now = Date.now();
  // Add 60s buffer
  if (tokens.token_expires_at > now + 60_000) {
    return tokens.access_token;
  }

  // Refresh
  const fresh: SpotifyTokens = await refreshToken(tokens.refresh_token);

  const supabase = createClient();
  await supabase
    .from('profiles')
    .update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token || tokens.refresh_token,
      token_expires_at: now + fresh.expires_in * 1000,
    })
    .eq('spotify_id', tokens.spotify_id);

  return fresh.access_token;
}

/** Convenience: get a valid access token for a spotify user, refreshing if needed */
export async function getValidToken(spotifyId: string): Promise<string | null> {
  const tokens = await getSpotifyTokensForUser(spotifyId);
  if (!tokens) return null;
  return refreshIfExpired(tokens);
}

/** Read spotify_user cookie and return the parsed value */
export async function getSpotifyUserFromCookies(): Promise<{ id: string; name: string } | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const raw = cookieStore.get('spotify_user')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}
