import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { ConversationRow } from '@/components/messages/conversation-row';
import { EmptyState, ScreenHeader } from '@/components/portal-ui';
import {
  conversationsChanged,
  fetchConversationWithUser,
  fetchConversations,
  MESSAGE_INBOX_POLL_MS,
  type ConversationPreview,
} from '@/lib/messages';
import { subscribeRefresh } from '@/lib/refresh-events';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ with?: string; conversation?: string }>();
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const silentRefreshRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const applyConversations = useCallback((next: ConversationPreview[]) => {
    setItems((prev) => (conversationsChanged(prev, next) ? next : prev));
  }, []);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean; pull?: boolean }) => {
      const silent = opts?.silent ?? false;
      const pull = opts?.pull ?? false;

      if (silent) {
        if (silentRefreshRef.current) return;
        silentRefreshRef.current = true;
      } else if (pull) {
        setRefreshing(true);
      } else if (!hasLoadedRef.current) {
        setLoading(true);
      }

      try {
        const data = await fetchConversations();
        applyConversations(data.items);
        hasLoadedRef.current = true;
      } catch {
        if (!silent && !hasLoadedRef.current) {
          setItems([]);
        }
      } finally {
        if (silent) {
          silentRefreshRef.current = false;
        } else if (pull) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [applyConversations],
  );

  useFocusEffect(
    useCallback(() => {
      void loadConversations();

      const refreshInbox = () => {
        void loadConversations({ silent: true });
      };

      refreshInbox();

      const interval = setInterval(() => {
        if (AppState.currentState === 'active') {
          refreshInbox();
        }
      }, MESSAGE_INBOX_POLL_MS);

      const unsubMessages = subscribeRefresh('moons:messages-refresh', refreshInbox);
      const unsubNotifications = subscribeRefresh('moons:notifications-refresh', refreshInbox);
      const appSub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          refreshInbox();
        }
      });

      return () => {
        clearInterval(interval);
        unsubMessages();
        unsubNotifications();
        appSub.remove();
      };
    }, [loadConversations]),
  );

  useFocusEffect(
    useCallback(() => {
      const conversationId =
        typeof params.conversation === 'string' ? params.conversation : undefined;
      if (conversationId) {
        router.replace(`/messages/${conversationId}` as never);
        return;
      }

      const userId = typeof params.with === 'string' ? params.with : undefined;
      if (!userId || openingUserId === userId) return;

      setOpeningUserId(userId);
      (async () => {
        try {
          const conv = await fetchConversationWithUser(userId);
          router.replace(`/messages/${conv.id}` as never);
        } catch {
          setOpeningUserId(null);
        }
      })();
    }, [params.with, params.conversation, openingUserId]),
  );

  return (
    <AppScreen>
      <AuthenticatedScreen>
        {openingUserId ? (
          <View style={styles.openingOverlay}>
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
        ) : null}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          extraData={items}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadConversations({ pull: true })}
              tintColor={colors.blue}
            />
          }
          ListHeaderComponent={
            <ScreenHeader
              eyebrow="Inbox"
              title="Your conversations"
              subtitle="Stay in touch with your professional network."
            />
          }
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/messages/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: 48 }} color={colors.blue} />
            ) : (
              <EmptyState
                icon="chatbubble-outline"
                title="No conversations yet"
                message="Connect with people on Network, then start a conversation from their profile."
              />
            )
          }
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  openingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
