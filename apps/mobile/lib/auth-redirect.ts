import type { AuthUser } from '@moons/shared';
import { UserRole } from '@moons/shared';

export function getPostAuthPath(user: AuthUser): string {
  if (!user.onboardingCompleted) {
    return '/onboarding';
  }
  return user.role === UserRole.RECRUITER ? '/(tabs)/my-jobs' : '/(tabs)/jobs';
}
