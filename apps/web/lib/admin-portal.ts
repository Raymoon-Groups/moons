const ADMIN_PORTAL_FLAG = 'moons_admin_portal';
const FLAG_MAX_AGE = 12 * 60 * 60;

export function setAdminPortalFlagCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_PORTAL_FLAG}=1; path=/; max-age=${FLAG_MAX_AGE}; SameSite=Lax`;
}

export function clearAdminPortalFlagCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_PORTAL_FLAG}=; path=/; max-age=0`;
}

export function hasAdminPortalFlagCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((part) => part.trim().startsWith(`${ADMIN_PORTAL_FLAG}=1`));
}
