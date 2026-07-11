import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import {
  fetchConversations,
  MESSAGE_INBOX_POLL_MS,
} from '@/lib/messages';
import {
  inspectInboxForIncomingMessages,
  prepareMessageSound,
  resetMessageSoundTracking,
} from '@/lib/message-sound';
import { subscribeRefresh } from '@/lib/refresh-events';

/** Plays the new-message tune when an incoming message arrives while the app is open. */
export function IncomingMessageSoundListener() {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready || !user) {
      resetMessageSoundTracking();
      return;
    }

    let cancelled = false;

    void prepareMessageSound();

    const syncInbox = async () => {
      if (cancelled || AppState.currentState !== 'active') return;
      try {
        const data = await fetchConversations();
        if (!cancelled) {
          inspectInboxForIncomingMessages(data.items);
        }
      } catch {
        // ignore when offline or logged out
      }
    };

    const initialTimer = setTimeout(() => {
      void syncInbox();
    }, 1200);

    const interval = setInterval(() => {
      void syncInbox();
    }, MESSAGE_INBOX_POLL_MS);

    const unsubMessages = subscribeRefresh('moons:messages-refresh', syncInbox);
    const unsubNotifications = subscribeRefresh('moons:notifications-refresh', syncInbox);
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncInbox();
    });

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
      unsubMessages();
      unsubNotifications();
      appSub.remove();
    };
  }, [ready, user]);

  return null;
}
