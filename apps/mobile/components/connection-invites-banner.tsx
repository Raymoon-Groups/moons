import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import { truncateMessagePreview } from '@/lib/messages';
import { fetchPendingReceived, type PendingRequestItem } from '@/lib/network';
import { subscribeRefresh } from '@/lib/refresh-events';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ConnectionInvitesBanner() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const [invites, setInvites] = useState<PendingRequestItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchPendingReceived();
      setInvites(data.items);
    } catch {
      setInvites([]);
    }
  }, [user]);

  useEffect(() => {
    if (!ready || !user) return;
    void load();
    const unsub = subscribeRefresh('moons:connections-refresh', load);
    const unsub2 = subscribeRefresh('moons:notifications-refresh', load);
    return () => {
      unsub();
      unsub2();
    };
  }, [ready, user, load]);

  if (!ready || !user || invites.length === 0) return null;

  const first = invites[0];
  const person = first.fromUser;
  const name = person?.fullName?.trim() || 'Someone';
  const avatar = person ? resolveAvatarUrl(person.avatarUrl) : null;
  const moreCount = invites.length - 1;

  async function handleAccept(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await acceptConnectionInvite(connectionId, { fullName: name });
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      void load();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleIgnore(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await ignoreConnectionInvite(connectionId);
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      void load();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: `${colors.blue}14`, borderBottomColor: `${colors.blue}33` }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {avatar ? (
            <Text style={{ fontSize: 16, ...fontStyle('bold'), color: colors.heading }}>{name.charAt(0)}</Text>
          ) : (
            <Text style={{ fontSize: 16, ...fontStyle('bold'), color: colors.heading }}>{name.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.heading }, fontStyle('semibold')]} numberOfLines={1}>
            {name} invited you to connect{moreCount > 0 ? ` · +${moreCount} more` : ''}
          </Text>
          {first.message ? (
            <Text style={[styles.message, { color: colors.muted }, fontStyle('regular')]} numberOfLines={2}>
              &ldquo;{truncateMessagePreview(first.message, 120)}&rdquo;
            </Text>
          ) : (
            <Text style={[styles.message, { color: colors.muted }]}>Accept to add them to your network</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        {first.message && person ? (
          <Pressable
            onPress={() => router.push(`/messages?with=${person.userId}` as never)}
            style={[styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          >
            <Text style={[fontStyle('semibold'), { color: colors.heading, fontSize: 12 }]}>View note</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={loadingId === first.id}
          onPress={() => void handleIgnore(first.id)}
          style={[styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, flex: 1 }]}
        >
          {loadingId === first.id ? (
            <ActivityIndicator size="small" color={colors.blue} />
          ) : (
            <Text style={[fontStyle('semibold'), { color: colors.heading, fontSize: 12 }]}>Ignore</Text>
          )}
        </Pressable>
        <Pressable
          disabled={loadingId === first.id}
          onPress={() => void handleAccept(first.id)}
          style={[styles.btnPrimary, { backgroundColor: colors.blue, flex: 1 }]}
        >
          <Text style={[fontStyle('semibold'), { color: '#fff', fontSize: 12 }]}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 14 },
  message: { marginTop: 2, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
