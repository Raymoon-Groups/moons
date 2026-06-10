import type { AuthUser } from '@moons/shared';

export function getPostAuthPath(user: AuthUser): string {
  if (!user.onboardingCompleted) {
    return '/onboarding';
  }
  return '/dashboard';
}
