import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authFetch } from './api-client';

export type NavIndicators = {
  network: boolean;
  messages: boolean;
  bell: boolean;
};

const POLL_MS = 10_000;
const INITIAL_DELAY_MS = 1200;

export function fetchNavIndicators() {
  return authFetch<NavIndicators>('/notifications/nav-indicators');
}

export function useNavIndicators() {
  const { user, ready } = useAuth();
  const [indicators, setIndicators] = useState<NavIndicators>({
    network: false,
    messages: false,
    bell: false,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setIndicators(await fetchNavIndicators());
    } catch {
      // ignore when logged out or API unavailable
    }
  }, [user]);

  useEffect(() => {
    if (!ready || !user) {
      setIndicators({ network: false, messages: false, bell: false });
      return;
    }

    const initialTimer = window.setTimeout(() => {
      void refresh();
    }, INITIAL_DELAY_MS);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }, POLL_MS);

    function onRefresh() {
      void refresh();
    }

    window.addEventListener('focus', onRefresh);
    document.addEventListener('visibilitychange', onRefresh);
    window.addEventListener('moons:notifications-refresh', onRefresh);
    window.addEventListener('moons:messages-refresh', onRefresh);
    window.addEventListener('moons:connections-refresh', onRefresh);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', onRefresh);
      document.removeEventListener('visibilitychange', onRefresh);
      window.removeEventListener('moons:notifications-refresh', onRefresh);
      window.removeEventListener('moons:messages-refresh', onRefresh);
      window.removeEventListener('moons:connections-refresh', onRefresh);
    };
  }, [ready, user, refresh]);

  return { indicators, refresh };
}
