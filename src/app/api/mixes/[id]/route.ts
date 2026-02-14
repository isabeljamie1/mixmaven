import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpotifyUserFromCookies } from '@/lib/spotify-server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient();

  const { data: mix, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !mix) return NextResponse.json({ error: 'Mix not found' }, { status: 404 });

  const { data: mixTracks } = await supabase
    .from('mix_tracks')
    .select('track_data, position')
    .eq('mix_id', params.id)
    .order('position', { ascending: true });

  return NextResponse.json({
    id: mix.id,
    name: mix.name,
    flowScore: mix.flow_score,
    createdAt: mix.created_at,
    tracks: (mixTracks ?? []).map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mt: any) => mt.track_data),
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSpotifyUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient();

  // Delete tracks first (FK), then mix
  await supabase.from('mix_tracks').delete().eq('mix_id', params.id);
  const { error } = await supabase
    .from('mixes')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
