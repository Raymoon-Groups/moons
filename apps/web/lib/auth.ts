import type { AuthResponse, AuthUser } from '@moons/shared';
import { setAssetAuthToken } from './assets';

const LEGACY_TOKEN_KEY = 'moons_access_token';
const LEGACY_REFRESH_KEY = 'moons_refresh_token';
const USER_KEY = 'moons_user';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/** In-memory only — used for media ?access_token= on cross-origin <img> (esp. local dev). Not persisted. */
let memoryAccessToken: string | null = null;

function clearLegacyTokenStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setSessionCookie(onboardingCompleted: boolean) {
  if (typeof document === 'undefined') return;
  document.cookie = `moons_session=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
  document.cookie = `moons_onboarded=${onboardingCompleted ? '1' : '0'}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
}

function clearSessionCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'moons_session=; path=/; max-age=0';
  document.cookie = 'moons_onboarded=; path=/; max-age=0';
}

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((part) => part.trim().startsWith('moons_session=1'));
}

/**
 * Persist user profile for UI hydration. Auth tokens live in HttpOnly cookies
 * (set by the API). Access token is kept in memory only for media URLs.
 */
export function setAuthSession(data: AuthResponse) {
  clearLegacyTokenStorage();
  memoryAccessToken = data.accessToken?.trim() ? data.accessToken.trim() : null;
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  setSessionCookie(!!data.user.onboardingCompleted);
  setAssetAuthToken(memoryAccessToken);
}

export function updateStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setSessionCookie(!!user.onboardingCompleted);
}

export function clearAuthSession() {
  clearLegacyTokenStorage();
  memoryAccessToken = null;
  localStorage.removeItem(USER_KEY);
  clearSessionCookies();
  setAssetAuthToken(null);
}

export function isAuthenticated(): boolean {
  return hasSessionCookie() || !!getStoredUser();
}
