import { NextResponse } from 'next/server';
import { getSpotifyUserFromCookies, getValidToken } from '@/lib/spotify-server';
import { searchTracks, getAudioFeatures } from '@/lib/spotify';
import { spotifyKeyToCamelot } from '@/lib/camelot';
import type { MixTrack } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });

  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const accessToken = await getValidToken(user.id);
  if (!accessToken) return NextResponse.json({ error: 'No tokens found' }, { status: 401 });

  try {
    const results = await searchTracks(accessToken, query);
    const ids = results.items.map((t) => t.id);
    const features = await getAudioFeatures(accessToken, ids);
    const featuresMap = new Map(features.map((f) => [f.id, f]));

    const mixTracks: MixTrack[] = results.items
      .filter((t) => featuresMap.has(t.id))
      .map((t) => {
        const audio = featuresMap.get(t.id)!;
        return {
          track: t,
          audio,
          camelot: spotifyKeyToCamelot(audio.key, audio.mode),
          bpm: Math.round(audio.tempo),
          energy: audio.energy,
        };
      });

    return NextResponse.json(mixTracks);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
