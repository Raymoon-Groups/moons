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
import { loginRequest, logoutRequest, persistAuthSession } from './api';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
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
      const token = await getAccessToken();
      const stored = await getStoredUser();
      if (token && stored) {
        setUser(stored);
      } else {
        await clearAuthSession();
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  const signIn = useCallback(async (data: AuthResponse) => {
    await persistAuthSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback(async (next: AuthUser) => {
    const token = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (token) {
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
