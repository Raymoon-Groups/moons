import type { AuthUser } from '@moons/shared';
import type { Profile } from '@/lib/types';

export function mergeProfileIntoUser(stored: AuthUser, profile: Profile): AuthUser {
  return {
    ...stored,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? null,
    avatarVersion: new Date(profile.updatedAt).getTime(),
  };
}
