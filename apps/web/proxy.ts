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
  '/feed',
];

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('moons_session')?.value === '1';
  const hasAdminPortal = request.cookies.get('moons_admin_portal')?.value === '1';

  const isAdminLogin = pathname === '/admin/login';
  const isAdminRoute =
    pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute && !isAdminLogin && !hasAdminPortal) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminLogin && hasAdminPortal) {
    const next = request.nextUrl.searchParams.get('next');
    if (next?.startsWith('/admin') && !next.startsWith('//')) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

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

  const onboarded = request.cookies.get('moons_onboarded')?.value === '1';

  // Incomplete sessions must finish onboarding — but never bounce login/register
  // based on a soft cookie alone (stale moons_session caused /login → /onboarding loops).
  if (isProtected && hasSession && pathname !== '/onboarding' && !isAdminRoute) {
    if (!onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Only skip auth pages when the user is fully signed in + onboarded.
  // Partial/stale sessions can open /login or /register to recover.
  if (isAuthPage && hasSession && onboarded) {
    const next = request.nextUrl.searchParams.get('next');
    if (next?.startsWith('/') && !next.startsWith('//')) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/profile',
    '/profile/:path*',
    '/applications',
    '/applications/:path*',
    '/recruiter',
    '/recruiter/:path*',
    '/onboarding',
    '/onboarding/:path*',
    '/settings',
    '/settings/:path*',
    '/network',
    '/network/:path*',
    '/feed',
    '/feed/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
