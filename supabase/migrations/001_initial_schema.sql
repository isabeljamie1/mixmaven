-- ============================================================================
-- MixMaven Database Schema
-- DJ set builder app — Supabase (PostgreSQL)
-- Generated: 2026-02-13
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES — extends Supabase auth.users
-- ============================================================================
create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  username        text unique,
  display_name    text,
  avatar_url      text,
  spotify_id      text unique,
  spotify_access_token   text,   -- encrypt at app layer or use vault
  spotify_refresh_token  text,
  spotify_token_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending Supabase auth.users';
comment on column public.profiles.spotify_access_token is 'Encrypted at application layer';
comment on column public.profiles.spotify_refresh_token is 'Encrypted at application layer';

-- ============================================================================
-- 2. MIXES
-- ============================================================================
create table public.mixes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles on delete cascade,
  title           text not null,
  description     text,
  is_public       boolean not null default true,
  slug            text,
  flow_score      numeric,
  avg_bpm         numeric,
  total_duration_ms integer,
  track_count     integer default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (user_id, slug)
);

comment on table public.mixes is 'DJ mixes / set lists';

-- ============================================================================
-- 3. MIX_TRACKS
-- ============================================================================
create table public.mix_tracks (
  id              uuid primary key default gen_random_uuid(),
  mix_id          uuid not null references public.mixes on delete cascade,
  spotify_track_id text not null,
  position        integer not null,
  title           text,
  artist          text,
  album_art_url   text,
  duration_ms     integer,
  bpm             numeric,
  musical_key     integer check (musical_key between 0 and 11),
  mode            integer check (mode in (0, 1)),
  camelot_code    text,
  energy          numeric,
  danceability    numeric,
  valence         numeric,
  fade_in_ms      integer,
  fade_out_ms     integer,
  start_time_ms   integer,
  end_time_ms     integer,
  created_at      timestamptz not null default now(),

  unique (mix_id, position)
);

comment on table public.mix_tracks is 'Ordered tracks within a mix';
comment on column public.mix_tracks.musical_key is 'Spotify pitch class (0=C, 1=C#, ... 11=B)';
comment on column public.mix_tracks.mode is '0=minor, 1=major';
comment on column public.mix_tracks.camelot_code is 'Camelot wheel code, e.g. 7A, 5B';

-- ============================================================================
-- 4. MIX_LIKES
-- ============================================================================
create table public.mix_likes (
  user_id   uuid not null references public.profiles on delete cascade,
  mix_id    uuid not null references public.mixes on delete cascade,
  created_at timestamptz not null default now(),

  primary key (user_id, mix_id)
);

-- ============================================================================
-- 5. FOLLOWS
-- ============================================================================
create table public.follows (
  follower_id   uuid not null references public.profiles on delete cascade,
  following_id  uuid not null references public.profiles on delete cascade,
  created_at    timestamptz not null default now(),

  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_mixes_user_id        on public.mixes (user_id);
create index idx_mixes_slug           on public.mixes (slug);
create index idx_mix_tracks_mix_pos   on public.mix_tracks (mix_id, position);
create index idx_profiles_spotify_id  on public.profiles (spotify_id);
create index idx_profiles_username    on public.profiles (username);
create index idx_mix_likes_mix_id     on public.mix_likes (mix_id);
create index idx_follows_following    on public.follows (following_id);

-- ============================================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_mixes_updated_at
  before update on public.mixes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- AUTO-CREATE PROFILE on auth.users insert
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Mixes
alter table public.mixes enable row level security;

create policy "Public mixes are viewable by everyone"
  on public.mixes for select using (is_public or auth.uid() = user_id);

create policy "Users can insert own mixes"
  on public.mixes for insert with check (auth.uid() = user_id);

create policy "Users can update own mixes"
  on public.mixes for update using (auth.uid() = user_id);

create policy "Users can delete own mixes"
  on public.mixes for delete using (auth.uid() = user_id);

-- Mix tracks
alter table public.mix_tracks enable row level security;

create policy "Mix tracks viewable if mix is viewable"
  on public.mix_tracks for select using (
    exists (
      select 1 from public.mixes
      where mixes.id = mix_tracks.mix_id
        and (mixes.is_public or mixes.user_id = auth.uid())
    )
  );

create policy "Users can insert tracks to own mixes"
  on public.mix_tracks for insert with check (
    exists (select 1 from public.mixes where id = mix_id and user_id = auth.uid())
  );

create policy "Users can update tracks in own mixes"
  on public.mix_tracks for update using (
    exists (select 1 from public.mixes where id = mix_id and user_id = auth.uid())
  );

create policy "Users can delete tracks from own mixes"
  on public.mix_tracks for delete using (
    exists (select 1 from public.mixes where id = mix_id and user_id = auth.uid())
  );

-- Mix likes
alter table public.mix_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.mix_likes for select using (true);

create policy "Users can like"
  on public.mix_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.mix_likes for delete using (auth.uid() = user_id);

-- Follows
alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);
