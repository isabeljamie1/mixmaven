import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { Mix } from '@/lib/types';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: { mixId: string } }
) {
  const supabase = createClient();

  const { data: mix } = await supabase
    .from('mixes')
    .select('*')
    .eq('id', params.mixId)
    .single() as { data: Mix | null };

  if (!mix) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: '#FAF0E6',
            fontSize: 48,
          }}
        >
          Mix not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const avgBpm = Math.round(mix.tracks.reduce((s, t) => s + t.bpm, 0) / mix.tracks.length);
  const albumArts = mix.tracks
    .slice(0, 4)
    .map((t) => t.track.album?.images?.[0]?.url)
    .filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          backgroundColor: '#1a1a1a',
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255, 107, 53, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(228, 91, 108, 0.15) 0%, transparent 50%)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', fontSize: 16, color: '#666', letterSpacing: '0.2em', marginBottom: 24 }}>
          MIXMAVEN
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#FAF0E6',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          {mix.name}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', fontSize: 24, color: '#999', marginBottom: 40 }}>
          {mix.tracks.length} tracks · {avgBpm} BPM
        </div>

        {/* Album art thumbnails */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          {albumArts.map((url, i) => (
            <img
              key={i}
              src={url!}
              width={80}
              height={80}
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
          ))}
          {albumArts.length === 0 &&
            ['🎵', '💃', '🔥', '✨'].slice(0, mix.tracks.length).map((emoji, i) => (
              <div
                key={i}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF6B35, #E45B6C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                {emoji}
              </div>
            ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#FF6B35' }}>
              {mix.flowScore}
            </div>
            <div style={{ display: 'flex', fontSize: 14, color: '#666', letterSpacing: '0.1em' }}>
              FLOW SCORE
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#E45B6C' }}>
              {avgBpm}
            </div>
            <div style={{ display: 'flex', fontSize: 14, color: '#666', letterSpacing: '0.1em' }}>
              AVG BPM
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#FAF0E6' }}>
              {mix.tracks.length}
            </div>
            <div style={{ display: 'flex', fontSize: 14, color: '#666', letterSpacing: '0.1em' }}>
              TRACKS
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
