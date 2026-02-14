import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/mix/', '/profile'];
const PUBLIC = ['/api/', '/', '/m/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (pathname === '/') return NextResponse.next();
  for (const p of PUBLIC) {
    if (p !== '/' && pathname.startsWith(p)) return NextResponse.next();
  }

  // Check protected routes
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  if (isProtected) {
    const user = request.cookies.get('spotify_user');
    if (!user?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/mix/:path*', '/profile/:path*'],
};
