import { NextResponse } from 'next/server';
import { configure, getAuthUrl } from '@/lib/spotify';
import { randomBytes } from 'crypto';

export async function GET() {
  configure({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  const state = randomBytes(16).toString('hex');
  const url = getAuthUrl(state);

  const response = NextResponse.redirect(url, { status: 302 });
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  return response;
}
