import { NextResponse } from 'next/server';
import { getSpotifyUserFromCookies, getValidToken } from '@/lib/spotify-server';
import { getSavedTracks, getPlaylistTracks, getAudioFeatures } from '@/lib/spotify';
import { spotifyKeyToCamelot } from '@/lib/camelot';
import type { MixTrack, SpotifyTrack, AudioFeatures } from '@/lib/types';

function enrichTracks(tracks: SpotifyTrack[], featuresMap: Map<string, AudioFeatures>): MixTrack[] {
  return tracks
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
}

export async function GET(request: Request) {
  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const accessToken = await getValidToken(user.id);
  if (!accessToken) return NextResponse.json({ error: 'No tokens found' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlist');

  try {
    let allTracks: SpotifyTrack[] = [];

    if (playlistId) {
      // Fetch playlist tracks
      let offset = 0;
      while (true) {
        const page = await getPlaylistTracks(accessToken, playlistId, offset);
        allTracks.push(...page.items.map((i) => i.track));
        if (!page.next) break;
        offset += page.limit;
      }
    } else {
      // Fetch saved tracks (up to 200)
      for (let offset = 0; offset < 200; offset += 50) {
        const page = await getSavedTracks(accessToken, offset);
        allTracks.push(...page.items.map((i) => i.track));
        if (!page.next) break;
      }
    }

    // Batch fetch audio features
    const ids = allTracks.map((t) => t.id);
    const features = await getAudioFeatures(accessToken, ids);
    const featuresMap = new Map(features.map((f) => [f.id, f]));

    const mixTracks = enrichTracks(allTracks, featuresMap);

    return NextResponse.json(mixTracks, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
