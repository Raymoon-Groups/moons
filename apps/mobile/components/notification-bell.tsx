import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NotificationItem } from '@moons/shared';
import {
  fetchBellNotifications,
  formatNotificationTime,
  markBellNotificationsRead,
} from '@/lib/notifications';
import { subscribeRefresh } from '@/lib/refresh-events';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function NotificationBell({ hasUnread, compact }: { hasUnread: boolean; compact?: boolean }) {
  const { colors } = useTheme();
  const btnSize = compact ? 36 : 40;
  const iconSize = compact ? 18 : 20;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchBellNotifications());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeRefresh('moons:notifications-refresh', load);
    return unsub;
  }, [load]);

  async function openPanel() {
    setOpen(true);
    await load();
    try {
      await markBellNotificationsRead();
    } catch {
      // ignore
    }
  }

  function handlePress(item: NotificationItem) {
    setOpen(false);
    if (!item.linkUrl) return;
    if (item.linkUrl.includes('networkTab=visitors')) {
      router.push('/profile/network?tab=visitors' as never);
      return;
    }
    if (item.linkUrl.includes('networkTab=pending') || item.linkUrl.includes('tab=pending')) {
      router.push('/network?tab=pending' as never);
      return;
    }
    if (item.linkUrl.startsWith('/network/')) {
      router.push(item.linkUrl as never);
      return;
    }
    if (item.linkUrl.startsWith('/')) {
      router.push(item.linkUrl as never);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => void openPanel()}
        style={[
          styles.bell,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={iconSize} color={colors.heading} />
        {hasUnread ? (
          <View style={[styles.dot, { backgroundColor: colors.blue, borderColor: colors.surfaceElevated }]} />
        ) : null}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.heading }, fontStyle('bold')]}>Notifications</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={colors.blue} />
            ) : items.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No notifications yet</Text>
            ) : (
              <ScrollView style={{ maxHeight: 360 }}>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handlePress(item)}
                    style={[styles.item, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[fontStyle('semibold'), { color: colors.heading, fontSize: 14 }]}>{item.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{item.body}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                      {formatNotificationTime(item.createdAt)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bell: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18 },
  empty: { textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  item: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
