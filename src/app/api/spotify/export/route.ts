import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshTokenIfNeeded(userId: string, tokens: { access_token: string; refresh_token: string; expires_at?: number }) {
  if (tokens.expires_at && Date.now() < tokens.expires_at * 1000 - 60000) {
    return tokens.access_token;
  }
  // Refresh
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  const data = await res.json();

  await supabase.from('profiles').update({
    spotify_access_token: data.access_token,
    spotify_expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    ...(data.refresh_token ? { spotify_refresh_token: data.refresh_token } : {}),
  }).eq('id', userId);

  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { mixId, name } = await req.json();
    if (!mixId || !name) {
      return NextResponse.json({ error: 'mixId and name required' }, { status: 400 });
    }

    // Get user from cookie/session (simplified: use first profile)
    const userId = req.headers.get('x-user-id') ?? req.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('spotify_access_token, spotify_refresh_token, spotify_expires_at, spotify_user_id')
      .eq('id', userId)
      .single();

    if (!profile?.spotify_access_token) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 401 });
    }

    const accessToken = await refreshTokenIfNeeded(userId, {
      access_token: profile.spotify_access_token,
      refresh_token: profile.spotify_refresh_token,
      expires_at: profile.spotify_expires_at,
    });

    // Get mix tracks
    const { data: mix } = await supabase
      .from('mixes')
      .select('track_uris')
      .eq('id', mixId)
      .single();

    if (!mix?.track_uris?.length) {
      return NextResponse.json({ error: 'Mix has no tracks' }, { status: 400 });
    }

    // Create Spotify playlist
    const createRes = await fetch(
      `https://api.spotify.com/v1/users/${profile.spotify_user_id}/playlists`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: `Created with MixMaven 🎧`,
          public: false,
        }),
      },
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: 'Failed to create playlist', details: err }, { status: 500 });
    }

    const playlist = await createRes.json();

    // Add tracks
    const addRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: mix.track_uris }),
      },
    );

    if (!addRes.ok) {
      return NextResponse.json({ error: 'Failed to add tracks' }, { status: 500 });
    }

    return NextResponse.json({
      url: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
      playlistId: playlist.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
