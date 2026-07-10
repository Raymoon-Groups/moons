import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { authFetch } from '@/lib/api';
import {
  getAckedNetworkPendingCount,
  setAckedNetworkPendingCount,
} from '@/lib/network-badge-storage';
import { markNetworkNotificationsRead } from '@/lib/notifications';
import { subscribeRefresh, emitRefresh } from '@/lib/refresh-events';

export type NavIndicators = {
  network: boolean;
  networkPendingCount: number;
  networkNotificationCount: number;
  messages: boolean;
  bell: boolean;
};

const POLL_MS = 10_000;
const INITIAL_DELAY_MS = 1200;

const EMPTY_INDICATORS: NavIndicators = {
  network: false,
  networkPendingCount: 0,
  networkNotificationCount: 0,
  messages: false,
  bell: false,
};

export function fetchNavIndicators() {
  return authFetch<NavIndicators>('/notifications/nav-indicators');
}

export function useNavIndicators() {
  const { user, ready } = useAuth();
  const [indicators, setIndicators] = useState<NavIndicators>(EMPTY_INDICATORS);
  const [ackedPendingCount, setAckedPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const next = await fetchNavIndicators();
      setIndicators({
        ...EMPTY_INDICATORS,
        ...next,
        networkPendingCount: next.networkPendingCount ?? (next.network ? 1 : 0),
        networkNotificationCount: next.networkNotificationCount ?? 0,
      });
    } catch {
      // ignore when logged out or API unavailable
    }
  }, [user]);

  const loadAckedPending = useCallback(async () => {
    if (!user) {
      setAckedPendingCount(0);
      return;
    }
    setAckedPendingCount(await getAckedNetworkPendingCount(user.id));
  }, [user]);

  const acknowledgeNetworkBadge = useCallback(
    async (pendingReceivedCount: number) => {
      if (!user) return;
      try {
        await markNetworkNotificationsRead();
      } catch {
        // still clear local badge when API is unavailable
      }
      await setAckedNetworkPendingCount(user.id, pendingReceivedCount);
      setAckedPendingCount(pendingReceivedCount);
      setIndicators((prev) => ({
        ...prev,
        networkNotificationCount: 0,
        network: prev.networkPendingCount > pendingReceivedCount,
      }));
      emitRefresh('moons:network-badge-ack');
      void refresh();
    },
    [user, refresh],
  );

  const showNetworkDot = useMemo(
    () =>
      indicators.networkNotificationCount > 0 ||
      indicators.networkPendingCount > ackedPendingCount,
    [indicators.networkNotificationCount, indicators.networkPendingCount, ackedPendingCount],
  );

  useEffect(() => {
    void loadAckedPending();
  }, [loadAckedPending]);

  useEffect(() => {
    if (!ready || !user) {
      setIndicators(EMPTY_INDICATORS);
      setAckedPendingCount(0);
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
    const unsubNetworkBadge = subscribeRefresh('moons:network-badge-ack', () => {
      void loadAckedPending();
      void refresh();
    });

    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      subscription.remove();
      unsubConnections();
      unsubMessages();
      unsubNotifications();
      unsubNetworkBadge();
    };
  }, [ready, user, refresh, loadAckedPending]);

  return { indicators, showNetworkDot, refresh, acknowledgeNetworkBadge };
}
