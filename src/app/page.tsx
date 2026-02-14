import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="font-serif text-6xl md:text-8xl bg-gradient-to-r from-golden via-coral to-rose bg-clip-text text-transparent">
          MixMaven
        </h1>
        <p className="mt-4 text-cream/60 text-lg">
          Build DJ sets powered by Spotify data
        </p>
      </div>
      <Link
        href="/api/auth/spotify"
        className="px-8 py-3 rounded-full bg-gradient-to-r from-coral to-rose text-white font-semibold text-lg hover:scale-105 transition-transform shadow-lg shadow-rose/20"
      >
        Login with Spotify
      </Link>
    </main>
  );
}
