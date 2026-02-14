import { NextRequest, NextResponse } from 'next/server';
import { configure, handleCallback, getUserProfile } from '@/lib/spotify';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const storedState = request.cookies.get('spotify_auth_state')?.value;

  if (error || !code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=spotify_auth_failed', request.url));
  }

  configure({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  try {
    const tokens = await handleCallback(code);
    const spotifyUser = await getUserProfile(tokens.access_token);

    const supabase = createClient();

    // Get the current Supabase user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url));
    }

    // Upsert profile with Spotify data
    await supabase.from('profiles').upsert({
      id: user.id,
      spotify_id: spotifyUser.id,
      display_name: spotifyUser.display_name,
      avatar_url: spotifyUser.images?.[0]?.url ?? null,
      spotify_access_token: tokens.access_token,
      spotify_refresh_token: tokens.refresh_token,
      spotify_token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000,
      ).toISOString(),
    });

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete('spotify_auth_state');
    return response;
  } catch (err) {
    console.error('Spotify callback error:', err);
    return NextResponse.redirect(new URL('/login?error=spotify_callback_failed', request.url));
  }
}
