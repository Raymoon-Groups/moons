import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

type InviteAction = 'idle' | 'accepted' | 'ignored';

export function ConnectionInvitesBanner() {
  const { user, ready } = useAuth();
  const { colors, isDark } = useTheme();
  const [invites, setInvites] = useState<PendingRequestItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<InviteAction>('idle');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchPendingReceived();
      setInvites(data.items);
      setActionState('idle');
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
  const isAccepted = actionState === 'accepted';
  const isIgnored = actionState === 'ignored';
  const actionTaken = isAccepted || isIgnored;
  const busy = loadingId === first.id;

  async function handleAccept(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await acceptConnectionInvite(connectionId, { fullName: name });
      setActionState('accepted');
      setTimeout(() => {
        setInvites((prev) => prev.filter((i) => i.id !== connectionId));
        setActionState('idle');
        setLoadingId(null);
      }, 1600);
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      setActionState('idle');
      setLoadingId(null);
      void load();
    }
  }

  async function handleIgnore(connectionId: string) {
    setLoadingId(connectionId);
    try {
      await ignoreConnectionInvite(connectionId);
      setActionState('ignored');
      setTimeout(() => {
        setInvites((prev) => prev.filter((i) => i.id !== connectionId));
        setActionState('idle');
        setLoadingId(null);
      }, 1200);
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== connectionId));
      setActionState('idle');
      setLoadingId(null);
      void load();
    }
  }

  const cardBg = isAccepted
    ? isDark
      ? 'rgba(16,185,129,0.12)'
      : '#ECFDF5'
    : isIgnored
      ? isDark
        ? 'rgba(239,68,68,0.12)'
        : '#FEF2F2'
      : colors.surfaceElevated;

  const cardBorder = isAccepted
    ? isDark
      ? 'rgba(16,185,129,0.35)'
      : '#A7F3D0'
    : isIgnored
      ? isDark
        ? 'rgba(239,68,68,0.35)'
        : '#FECACA'
      : colors.border;

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
          theme.shadow.card,
        ]}
      >
        <View style={styles.topMeta}>
          <View style={[styles.badge, { backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14` }]}>
            <Ionicons name="people" size={11} color={colors.blue} />
            <Text style={[styles.badgeText, { color: colors.blue }, fontStyle('bold')]}>Connection</Text>
          </View>
          {!actionTaken && moreCount > 0 ? (
            <Pressable
              onPress={() => router.push('/(tabs)/network?tab=pending' as never)}
              hitSlop={8}
              style={[styles.morePill, { backgroundColor: isDark ? colors.surface : `${colors.blue}10` }]}
            >
              <Text style={[{ color: colors.muted, fontSize: 11 }, fontStyle('semibold')]}>
                +{moreCount} more
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            if (person?.userId) router.push(`/network/${person.userId}` as never);
          }}
          style={styles.personRow}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDark ? colors.surface : `${colors.blue}14`,
                borderColor: colors.surfaceElevated,
              },
            ]}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[{ fontSize: 18, color: colors.blue }, fontStyle('bold')]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]} numberOfLines={2}>
              {isAccepted
                ? 'You are now connected'
                : isIgnored
                  ? 'Request declined'
                  : `${name} invited you to connect`}
            </Text>
            {actionTaken ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: isAccepted ? '#059669' : colors.error },
                  fontStyle('medium'),
                ]}
                numberOfLines={2}
              >
                {isAccepted
                  ? `${name} is now in your network.`
                  : `You declined ${name}'s invitation.`}
              </Text>
            ) : first.message ? (
              <Text style={[styles.note, { color: colors.muted, backgroundColor: isDark ? colors.surface : '#F5F8FC' }]} numberOfLines={2}>
                “{truncateMessagePreview(first.message, 100)}”
              </Text>
            ) : (
              <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={2}>
                Accept to add them to your network
              </Text>
            )}
          </View>
        </Pressable>

        {!actionTaken ? (
          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={() => void handleIgnore(first.id)}
              style={[
                styles.btn,
                styles.btnSecondary,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.surface : '#fff',
                  opacity: busy ? 0.6 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.muted} />
              ) : (
                <Text style={[{ color: colors.heading, fontSize: 13 }, fontStyle('semibold')]}>Ignore</Text>
              )}
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => void handleAccept(first.id)}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.blue, opacity: busy ? 0.7 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={[{ color: '#fff', fontSize: 13 }, fontStyle('bold')]}>Accept</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {!actionTaken && invites.length > 1 ? (
          <Pressable
            onPress={() => router.push('/(tabs)/network?tab=pending' as never)}
            style={styles.seeAll}
            hitSlop={6}
          >
            <Text style={[{ color: colors.blue, fontSize: 12 }, fontStyle('semibold')]}>
              Review all invitations
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.blue} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 10,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  morePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, lineHeight: 20 },
  subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  note: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPrimary: {},
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 2,
  },
});
