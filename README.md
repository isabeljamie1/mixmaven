# MixMaven

> Build harmonic DJ sets, preview transitions, and share mixes — powered by Spotify.

MixMaven is a web app for DJs and music nerds who want to assemble sets that actually flow. Pull tracks from your Spotify library, drop them into a mix, and let the Camelot-wheel engine score every transition by key, BPM, and energy. Export the finished set back to Spotify as a playlist, or share a public mix page with cover art.

---

## Features

- **Spotify integration** — OAuth login, library/playlist browsing, track search, and one-click playlist export.
- **Harmonic mixing engine** — every track is mapped to its [Camelot code](https://mixedinkey.com/camelot-wheel/) and transitions are scored on a 0–100 scale (Perfect / Smooth / Workable / Tricky / Clash).
- **BPM + energy awareness** — transition scores combine key compatibility (60%), BPM match (30%), and energy delta (10%).
- **Mix flow score** — every set gets an overall 0.0–5.0 rating based on how well its transitions chain together.
- **Drag-and-drop builder** — reorder tracks with `@dnd-kit`; the score updates live.
- **Smart Suggest** — surfaces tracks from your library that are harmonically compatible with the current end of your mix.
- **In-browser preview** — uses the Spotify Web Playback SDK for premium accounts; falls back to 30-second previews otherwise.
- **Shareable mix pages** — public URLs at `/m/[username]/[slug]` with auto-generated Open Graph cover art.
- **Persistent storage** — mixes, profiles, likes, and follows live in Supabase (Postgres + RLS).

---

## Tech stack

| Layer       | Choice                                                 |
| ----------- | ------------------------------------------------------ |
| Framework   | [Next.js 14](https://nextjs.org) (App Router)          |
| Language    | TypeScript                                             |
| Styling     | Tailwind CSS, Inter + DM Serif Display                 |
| Auth & DB   | [Supabase](https://supabase.com) (Postgres, Auth, RLS) |
| Music data  | Spotify Web API + Web Playback SDK                     |
| DnD         | `@dnd-kit/core` + `@dnd-kit/sortable`                  |
| Deployment  | Vercel (recommended)                                   |

---

## Project structure

```
mixmaven/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing / login
│   │   ├── dashboard/          # Authenticated home
│   │   ├── mix/[id]/           # Mix builder, play, share views
│   │   ├── m/[username]/[slug] # Public mix pages
│   │   ├── profile/            # User profile
│   │   └── api/                # Route handlers
│   │       ├── auth/spotify/   # OAuth start + callback
│   │       ├── spotify/        # search, library, export proxy
│   │       ├── mixes/          # CRUD for saved mixes
│   │       └── og/[mixId]/     # Open Graph image generation
│   ├── components/             # UI (MixBuilder, TrackBrowser, etc.)
│   ├── hooks/                  # useMixStore, useSpotifyData, useSpotifyPlayer, useAudioPlayer
│   └── lib/                    # client-side helpers (also mirrored in /lib)
├── lib/
│   ├── camelot.ts              # Key mapping + transition scoring
│   ├── spotify.ts              # Spotify Web API client (no SDK)
│   ├── types.ts                # Shared TS types
│   └── supabase/               # Server, client, and middleware helpers
├── supabase/
│   └── migrations/             # SQL schema (profiles, mixes, mix_tracks, likes, follows)
├── middleware.ts               # Refreshes Supabase session on every request
└── tailwind.config.ts
```

---

## Getting started

### 1. Prerequisites

- Node.js 18.17+ (Next.js 14 requirement)
- A [Spotify Developer](https://developer.spotify.com/dashboard) app (Client ID + Secret)
- A [Supabase](https://supabase.com) project (URL + anon key)

### 2. Spotify app setup

1. Create an app at <https://developer.spotify.com/dashboard>.
2. Add the following Redirect URI:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
   (and your production URL once deployed).
3. Copy the **Client ID** and **Client Secret** into `.env.local`.

The app requests these scopes: `user-library-read`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`, `streaming`, `user-read-playback-state`.

### 3. Supabase setup

1. Create a new Supabase project.
2. Run the migration to create the schema:
   ```bash
   # Using the Supabase CLI:
   supabase db push

   # Or paste supabase/migrations/001_initial_schema.sql into the SQL editor.
   ```
3. Copy the project URL and anon key into `.env.local`.

The schema creates `profiles`, `mixes`, `mix_tracks`, `mix_likes`, and `follows`, with RLS policies that make public mixes world-readable while keeping writes locked to the owning user. A trigger on `auth.users` auto-creates a profile row at signup.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXTAUTH_SECRET=          # any random string used for state/session signing
NEXTAUTH_URL=http://localhost:3000
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Login with Spotify**.

### Scripts

| Command         | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the dev server on port 3000     |
| `npm run build` | Production build                      |
| `npm run start` | Run the production build              |
| `npm run lint`  | ESLint (Next.js config)               |

---

## How the mixing engine works

The harmonic logic lives in [`lib/camelot.ts`](lib/camelot.ts).

### Key mapping

Spotify reports each track's pitch class (`key`, 0–11) and `mode` (0 = minor, 1 = major). MixMaven maps that pair to the corresponding Camelot code — for example, A minor → `8A`, C major → `8B`. Codes ending in `A` are minor keys; `B` codes are major.

### Transition scoring

Given two adjacent tracks **A** and **B**, the engine computes:

| Component | Weight | Logic                                                                  |
| --------- | -----: | ---------------------------------------------------------------------- |
| Key       |   60 % | Perfect (same) = 100, Adjacent (±1) = 80, Energy shift (A↔B) = 70, then distance falloff |
| BPM       |   30 % | Within 3 % = 80, within 6 % = 50, then linear falloff                  |
| Energy    |   10 % | `100 − |Eₐ − E_b| × 200`                                              |

The final 0–100 score gets a label and a traffic-light color:

- **Perfect** (≥85) — green
- **Smooth** (70–84) — green
- **Workable** (50–69) — yellow
- **Tricky** (30–49) — red
- **Clash** (<30) — red

### Mix flow score

The set's overall **flow score** is the average transition score scaled to 0.0–5.0. A four-track mix with three "Smooth" transitions averaging 78 lands at roughly **3.9 / 5.0**.

---

## Deployment

The easiest path is Vercel:

1. Push the repo to GitHub and import it in Vercel.
2. Add all `.env.local` variables to the Vercel project settings.
3. Update your Spotify app's Redirect URI to `https://<your-domain>/api/auth/spotify/callback`.
4. Update `NEXTAUTH_URL` to the production domain.

For other hosts: any Node.js environment that supports Next.js 14's App Router and edge middleware will work.

---

## Security notes

- Spotify access/refresh tokens are stored on the `profiles` table; encrypt them at the application layer (or via Supabase Vault) before going to production. The schema columns are commented as such.
- All mix/track tables have RLS enabled — public mixes are readable by anyone, but writes require `auth.uid()` to match the owner.
- The `middleware.ts` at the project root rewrites Supabase session cookies on every request so server components see a fresh session.

---

## Roadmap ideas

- Cue point editing and per-track fade in/out times (the schema already has fields for these).
- Crowdsourced mix discovery feed.
- Apple Music / SoundCloud track sources.
- Beatmatched audio preview rendering (Web Audio API crossfade).

---

## License

No license is currently specified. Treat this codebase as all-rights-reserved unless a `LICENSE` file is added.
