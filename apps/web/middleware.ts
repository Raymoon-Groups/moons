import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/applications',
  '/recruiter',
  '/onboarding',
  '/settings',
  '/network',
];

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('moons_session')?.value === '1';

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && hasSession && pathname !== '/onboarding') {
    const onboarded = request.cookies.get('moons_onboarded')?.value === '1';
    if (!onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/applications/:path*',
    '/recruiter/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/network/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
