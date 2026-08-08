import { Ionicons } from '@expo/vector-icons';
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
import { NotificationType, type NotificationItem } from '@moons/shared';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import { fetchPendingReceived } from '@/lib/network';
import {
  fetchBellNotifications,
  formatNotificationTime,
  markBellNotificationsRead,
  markNotificationRead,
  notifyNotificationsRefresh,
} from '@/lib/notifications';
import { openNotification } from '@/lib/notification-navigation';
import { subscribeRefresh, emitRefresh } from '@/lib/refresh-events';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type InviteActionState = 'accepted' | 'ignored';

function getConnectionId(item: NotificationItem): string | null {
  const meta = item.metadata;
  if (!meta || typeof meta !== 'object') return null;
  const id = (meta as { connectionId?: unknown }).connectionId;
  return typeof id === 'string' && id.trim() ? id : null;
}

function isInviteStillActionable(
  item: NotificationItem,
  pendingIds: Set<string>,
  items: NotificationItem[],
) {
  const connectionId = getConnectionId(item);
  if (!connectionId) return false;
  if (!pendingIds.has(connectionId)) return false;
  return !items.some(
    (n) =>
      n.type === NotificationType.CONNECTION_ACCEPTED &&
      getConnectionId(n) === connectionId,
  );
}

export function NotificationBell({
  hasUnread,
  compact,
  bare = false,
}: {
  hasUnread: boolean;
  compact?: boolean;
  bare?: boolean;
}) {
  const { colors } = useTheme();
  const btnSize = compact ? 36 : 40;
  const iconSize = compact ? 18 : 20;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pendingInviteIds, setPendingInviteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionById, setActionById] = useState<Record<string, InviteActionState>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, pending] = await Promise.all([
        fetchBellNotifications(),
        fetchPendingReceived(1).catch(() => ({ items: [] as { id: string }[] })),
      ]);
      setItems(data);
      setPendingInviteIds(new Set(pending.items.map((p) => p.id)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubNotif = subscribeRefresh('moons:notifications-refresh', load);
    const unsubConn = subscribeRefresh('moons:connections-refresh', load);
    return () => {
      unsubNotif();
      unsubConn();
    };
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

  async function handlePress(item: NotificationItem) {
    setOpen(false);
    try {
      if (!item.readAt) {
        await markNotificationRead(item.id);
        notifyNotificationsRefresh();
      }
    } catch {
      // still navigate even if mark-read fails
    }
    openNotification(item);
  }

  async function handleInviteAction(item: NotificationItem, action: 'accept' | 'ignore') {
    const connectionId = getConnectionId(item);
    if (!connectionId || actionLoadingId) return;
    setActionLoadingId(item.id);
    try {
      if (action === 'accept') {
        await acceptConnectionInvite(connectionId, {
          fullName: item.title?.replace(/\s+invited you.*$/i, '').trim() || null,
        });
        setActionById((prev) => ({ ...prev, [item.id]: 'accepted' }));
      } else {
        await ignoreConnectionInvite(connectionId);
        setActionById((prev) => ({ ...prev, [item.id]: 'ignored' }));
      }
      setPendingInviteIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
      try {
        await markNotificationRead(item.id);
      } catch {
        // ignore
      }
      emitRefresh('moons:notifications-refresh');
      setTimeout(() => {
        setItems((prev) => prev.filter((n) => n.id !== item.id));
        setActionById((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }, 1600);
    } catch {
      // keep item
    } finally {
      setActionLoadingId(null);
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
            borderWidth: bare ? 0 : 1,
            borderColor: bare ? 'transparent' : colors.border,
            backgroundColor: bare ? 'transparent' : colors.surfaceElevated,
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
              <Text style={[styles.sheetTitle, { color: colors.heading }, fontStyle('bold')]}>
                Notifications
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={colors.blue} />
            ) : (() => {
              const visibleItems = items.filter((item) => {
                if (item.type !== NotificationType.CONNECTION_REQUEST) return true;
                if (actionById[item.id]) return true;
                return isInviteStillActionable(item, pendingInviteIds, items);
              });
              if (visibleItems.length === 0) {
                return <Text style={[styles.empty, { color: colors.muted }]}>No notifications yet</Text>;
              }
              return (
              <ScrollView style={{ maxHeight: 420 }}>
                {visibleItems.map((item) => {
                  const isRequest = item.type === NotificationType.CONNECTION_REQUEST;
                  const connectionId = getConnectionId(item);
                  const inviteState = actionById[item.id];
                  const canAct =
                    isRequest &&
                    !!connectionId &&
                    !inviteState &&
                    isInviteStillActionable(item, pendingInviteIds, items);

                      return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        // Always open the related screen; invite actions stay as separate buttons.
                        void handlePress(item);
                      }}
                      style={[styles.item, { borderBottomColor: colors.border }]}
                    >
                      <View style={styles.itemTop}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[fontStyle('semibold'), { color: colors.heading, fontSize: 14 }]}>
                            {item.title}
                          </Text>
                          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{item.body}</Text>
                          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                            {formatNotificationTime(item.createdAt)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                      </View>

                      {inviteState === 'accepted' ? (
                        <Text style={{ color: '#15803d', fontSize: 12, marginTop: 8, ...fontStyle('semibold') }}>
                          Connection accepted
                        </Text>
                      ) : null}
                      {inviteState === 'ignored' ? (
                        <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 8, ...fontStyle('semibold') }}>
                          Request ignored
                        </Text>
                      ) : null}

                      {canAct ? (
                        <View style={styles.actions}>
                          <Pressable
                            disabled={actionLoadingId === item.id}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              void handleInviteAction(item, 'accept');
                            }}
                            style={[styles.actionBtn, { backgroundColor: colors.blue }]}
                          >
                            <Text style={{ color: '#fff', fontSize: 12, ...fontStyle('bold') }}>
                              {actionLoadingId === item.id ? '…' : 'Accept'}
                            </Text>
                          </Pressable>
                          <Pressable
                            disabled={actionLoadingId === item.id}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              void handleInviteAction(item, 'ignore');
                            }}
                            style={[
                              styles.actionBtn,
                              {
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: '#fecaca',
                              },
                            ]}
                          >
                            <Text style={{ color: '#dc2626', fontSize: 12, ...fontStyle('bold') }}>
                              Ignore
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </Pressable>
                      );
                })}
              </ScrollView>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bell: {
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
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
