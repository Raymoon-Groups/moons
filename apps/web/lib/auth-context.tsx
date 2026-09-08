'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthResponse, AuthUser } from '@moons/shared';
import { ApiError, authFetch, ensureWebSession } from './api-client';
import {
  clearAuthSession,
  getStoredUser,
  hasSessionCookie,
  setAuthSession,
  updateStoredUser,
} from './auth';
import type { Profile } from './types';
import { setAssetAuthToken } from './assets';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (data: AuthResponse) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  syncUserFromProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeProfileIntoUser(stored: AuthUser, profile: Profile): AuthUser {
  return {
    ...stored,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? null,
    avatarVersion: new Date(profile.updatedAt).getTime(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const syncUserFromProfile = useCallback((profile: Profile) => {
    const stored = getStoredUser();
    if (!stored) return;
    const updated = mergeProfileIntoUser(stored, profile);
    updateStoredUser(updated);
    setUser(updated);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!hasSessionCookie() && !getStoredUser()) return;

    try {
      const profile = await authFetch<Profile>('/profiles/me');
      syncUserFromProfile(profile);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SESSION_EXPIRED') {
        clearAuthSession();
        setAssetAuthToken(null);
        setUser(null);
      }
    }
  }, [syncUserFromProfile]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = getStoredUser();
      const hasSession = hasSessionCookie() || !!stored;

      if (!hasSession) {
        setAssetAuthToken(null);
        if (!cancelled) setReady(true);
        return;
      }

      if (stored) setUser(stored);

      const ok = await ensureWebSession();
      if (cancelled) return;

      if (!ok) {
        setUser(null);
        setReady(true);
        return;
      }

      setReady(true);
      window.setTimeout(() => {
        if (!cancelled) void refreshProfile();
      }, 800);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const login = useCallback((data: AuthResponse) => {
    setAuthSession(data);
    setUser(data.user);
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      updateStoredUser(updated);
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch {
      // clear local session even if API call fails
    }
    clearAuthSession();
    setAssetAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, updateUser, logout, refreshProfile, syncUserFromProfile }),
    [user, ready, login, updateUser, logout, refreshProfile, syncUserFromProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
