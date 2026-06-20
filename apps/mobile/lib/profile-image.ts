import { UserRole } from '@moons/shared';
import { resolveAssetUrl, resolveAvatarUrl } from '@/lib/assets';
import type { AuthUser } from '@moons/shared';
import type { Profile } from '@/lib/types';

/** `avatar` = personal photo only (profile tab). `dashboard` = logo then avatar (home). */
export type ProfileImageMode = 'avatar' | 'dashboard';

function profileVersion(profile: Profile | null | undefined) {
  return profile?.updatedAt ? new Date(profile.updatedAt).getTime() : undefined;
}

export function getCompanyLogoUrl(profile: Profile | null | undefined): string | null {
  if (!profile?.companyLogoUrl) return null;
  const base = resolveAssetUrl(profile.companyLogoUrl);
  if (!base) return null;
  const version = profileVersion(profile);
  if (!version) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${version}`;
}

export function getProfileImageUrl(
  user: AuthUser | null | undefined,
  profile: Profile | null | undefined,
  mode: ProfileImageMode = 'dashboard',
): string | null {
  const version = profileVersion(profile) ?? user?.avatarVersion;

  if (profile) {
    if (mode === 'dashboard' && user?.role === UserRole.RECRUITER) {
      const logo = getCompanyLogoUrl(profile);
      if (logo) return logo;
    }

    if (profile.avatarUrl) {
      return resolveAvatarUrl(profile.avatarUrl, version);
    }

    // Profile loaded with no avatar — do not fall back to stale auth user cache.
    return null;
  }

  return resolveAvatarUrl(user?.avatarUrl, user?.avatarVersion);
}
