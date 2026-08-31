import type { AuthUser } from '@moons/shared';

export function getPostAuthPath(user: AuthUser): string {
  if (!user.onboardingCompleted) return '/onboarding';
  return '/dashboard';
}

/** Safe internal redirect after login (blocks open redirects). */
export function getSafeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

export function getLoginRedirectPath(
  user: AuthUser,
  next: string | null | undefined,
): string {
  const safeNext = getSafeNextPath(next, '');
  if (safeNext.startsWith('/admin')) return safeNext;
  if (!user.onboardingCompleted) return '/onboarding';
  return safeNext || '/dashboard';
}
