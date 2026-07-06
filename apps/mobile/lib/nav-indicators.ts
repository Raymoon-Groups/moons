import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { authFetch } from '@/lib/api';
import { subscribeRefresh } from '@/lib/refresh-events';

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

    const initialTimer = setTimeout(() => {
      void refresh();
    }, INITIAL_DELAY_MS);

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refresh();
      }
    }, POLL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };

    const unsubConnections = subscribeRefresh('moons:connections-refresh', refresh);
    const unsubMessages = subscribeRefresh('moons:messages-refresh', refresh);
    const unsubNotifications = subscribeRefresh('moons:notifications-refresh', refresh);

    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      subscription.remove();
      unsubConnections();
      unsubMessages();
      unsubNotifications();
    };
  }, [ready, user, refresh]);

  return { indicators, refresh };
}
