import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse, AuthUser } from '@moons/shared';
import { loginRequest, logoutRequest, persistAuthSession, ensureFreshSession } from './api';
import { setAssetAuthToken } from './assets';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth-storage';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signIn: (data: AuthResponse) => Promise<AuthUser>;
  updateUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sessionUser = await ensureFreshSession();
        setUser(sessionUser);
      } catch {
        // Keep any stored session on unexpected boot errors (SecureStore blips, etc.).
        try {
          const { getStoredUser } = await import('./auth-storage');
          const stored = await getStoredUser();
          setUser(stored);
          if (!stored) {
            setAssetAuthToken(null);
          }
        } catch {
          setAssetAuthToken(null);
          setUser(null);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setAssetAuthToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const signIn = useCallback(async (data: AuthResponse) => {
    await persistAuthSession(data);
    setAssetAuthToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback(async (next: AuthUser) => {
    const token = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (token) {
      setAssetAuthToken(token);
      await setAuthSession({
        accessToken: token,
        refreshToken: refreshToken ?? undefined,
        user: next,
      });
    }
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setAssetAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, signIn, updateUser, logout }),
    [user, ready, login, signIn, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
