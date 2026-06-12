import type { AuthResponse, AuthUser } from '@moons/shared';

const TOKEN_KEY = 'moons_access_token';
const USER_KEY = 'moons_user';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
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

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

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

export function setAuthSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  setSessionCookie(!!data.user.onboardingCompleted);
}

export function updateStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setSessionCookie(!!user.onboardingCompleted);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearSessionCookies();
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
