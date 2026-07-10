import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  fetchConversationWithUser,
  fetchConversations,
  type ConversationPreview,
} from '@/lib/messages';
import { subscribeRefresh } from '@/lib/refresh-events';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ with?: string }>();
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchConversations();
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      const unsub = subscribeRefresh('moons:messages-refresh', () => void load(true));
      return unsub;
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
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
    }, [params.with, openingUserId]),
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.blue} />
          }
          ListHeaderComponent={
            <ScreenHeader
              eyebrow="Inbox"
              title="Messaging"
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
