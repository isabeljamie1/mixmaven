import { NextRequest, NextResponse } from 'next/server';
import { configure, handleCallback, getUserProfile } from '@/lib/spotify';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const storedState = request.cookies.get('spotify_auth_state')?.value;

  if (error || !code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=spotify_auth_failed', origin));
  }

  configure({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  try {
    const tokens = await handleCallback(code);
    const spotifyUser = await getUserProfile(tokens.access_token);

    // Use service role client to upsert profile directly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if a profile with this spotify_id already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('spotify_id', spotifyUser.id)
      .single();

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;
      // Update tokens
      await supabase.from('profiles').update({
        display_name: spotifyUser.display_name,
        avatar_url: spotifyUser.images?.[0]?.url ?? null,
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
      }).eq('id', profileId);
    } else {
      // Create a new auth user via Supabase signUp, then update profile
      const email = `${spotifyUser.id}@spotify.mixmaven.local`;
      const password = crypto.randomUUID();

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          spotify_id: spotifyUser.id,
          display_name: spotifyUser.display_name,
          avatar_url: spotifyUser.images?.[0]?.url,
        },
      });

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError);
        return NextResponse.redirect(new URL('/?error=account_creation_failed', origin));
      }

      profileId = authData.user.id;

      // The trigger should have created the profile, update it with Spotify data
      await supabase.from('profiles').update({
        username: spotifyUser.id,
        spotify_id: spotifyUser.id,
        display_name: spotifyUser.display_name,
        avatar_url: spotifyUser.images?.[0]?.url ?? null,
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
      }).eq('id', profileId);
    }

    // Redirect to the mix builder with spotify data stored
    const response = NextResponse.redirect(new URL('/mix/demo', origin));
    response.cookies.delete('spotify_auth_state');
    // Store spotify user info in a cookie for the client
    response.cookies.set('spotify_user', JSON.stringify({
      id: spotifyUser.id,
      name: spotifyUser.display_name,
      avatar: spotifyUser.images?.[0]?.url,
    }), { path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (err) {
    console.error('Spotify callback error:', err);
    return NextResponse.redirect(new URL('/?error=spotify_callback_failed', origin));
  }
}
