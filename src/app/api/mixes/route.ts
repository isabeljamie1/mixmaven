import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpotifyUserFromCookies } from '@/lib/spotify-server';

export async function GET() {
  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from('mixes')
    .select('id, name, flow_score, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const supabase = createClient();

  // Upsert the mix
  const mixData = {
    id: body.id || undefined,
    user_id: user.id,
    name: body.name || 'Untitled Mix',
    flow_score: body.flowScore ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data: mix, error: mixError } = body.id
    ? await supabase.from('mixes').update(mixData).eq('id', body.id).select().single()
    : await supabase.from('mixes').insert(mixData).select().single();

  if (mixError || !mix) {
    return NextResponse.json({ error: mixError?.message ?? 'Failed to save mix' }, { status: 500 });
  }

  // Replace mix_tracks: delete old, insert new
  await supabase.from('mix_tracks').delete().eq('mix_id', mix.id);

  if (body.tracks?.length) {
    const mixTracks = body.tracks.map((t: any, i: number) => ({
      mix_id: mix.id,
      track_id: t.track.id,
      position: i,
      track_data: t, // store the full MixTrack as JSONB
    }));

    const { error: tracksError } = await supabase.from('mix_tracks').insert(mixTracks);
    if (tracksError) {
      return NextResponse.json({ error: tracksError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: mix.id });
}
