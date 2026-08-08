import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NetworkUserCard } from '@moons/shared';
import type { ConnectionUpdate } from '@/components/network/person-card';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { acceptConnection, cancelConnection, rejectConnection } from '@/lib/network';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

function formatRequestDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRequestTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ConnectionRequestCard({
  person,
  connectionId,
  createdAt,
  direction,
  onConnectionChange,
  onUpdated,
}: {
  person: NetworkUserCard;
  connectionId: string;
  createdAt: string;
  direction: 'received' | 'sent';
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onUpdated?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gone, setGone] = useState(false);

  const avatar = resolveAvatarUrl(person.avatarUrl);
  const name = person.fullName?.trim() || 'Professional';
  const roleLine = person.headline || person.currentCompany || person.location || 'Professional';
  const pageBg = isDark ? colors.background : '#ffffff';
  const cardBg = isDark ? colors.surfaceElevated : '#E8EAF6';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: 14,
        },
        card: {
          backgroundColor: cardBg,
          borderRadius: 24,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingRight: 92,
        },
        avatar: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: isDark ? colors.surface : '#fff',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,23,42,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: '100%', height: '100%' },
        copy: { flex: 1, minWidth: 0, marginLeft: 12, paddingTop: 2 },
        title: {
          fontSize: 16,
          lineHeight: 21,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        subtitle: {
          marginTop: 3,
          fontSize: 13,
          lineHeight: 18,
          color: isDark ? colors.muted : '#3f4a5c',
          ...fontStyle('medium'),
        },
        bottomRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 16,
        },
        datePill: {
          backgroundColor: isDark ? colors.surface : '#fff',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        dateText: {
          fontSize: 12,
          color: colors.heading,
          ...fontStyle('semibold'),
        },
        timeText: {
          fontSize: 13,
          color: isDark ? colors.muted : '#4a5568',
          ...fontStyle('medium'),
        },
        /** White notch holding accept / decline — matches mockup cutout. */
        actionNotch: {
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: pageBg,
          borderBottomLeftRadius: 22,
          paddingLeft: 10,
          paddingBottom: 10,
          paddingTop: 4,
          paddingRight: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        actionBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
        },
        acceptBtn: {
          backgroundColor: colors.blue,
        },
        rejectBtn: {
          backgroundColor: isDark ? colors.surface : '#fff',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,23,42,0.1)',
        },
        error: {
          marginTop: 6,
          marginLeft: 4,
          fontSize: 12,
          color: colors.error,
          ...fontStyle('medium'),
        },
      }),
    [cardBg, colors, isDark, pageBg],
  );

  if (gone) return null;

  async function run(action: () => Promise<unknown>, update: ConnectionUpdate) {
    setLoading(true);
    setError('');
    try {
      await action();
      setGone(true);
      onConnectionChange?.(person.userId, update);
      notifyConnectionsRefresh();
      onUpdated?.();
    } catch (err) {
      if (isStaleConnectionInviteError(err)) {
        setGone(true);
        onConnectionChange?.(person.userId, update);
        notifyConnectionsRefresh();
        return;
      }
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Pressable onPress={() => router.push(`/network/${person.userId}` as never)}>
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[{ fontSize: 17, color: colors.heading }, fontStyle('bold')]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                Request — {name}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {roleLine}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{formatRequestDate(createdAt)}</Text>
            </View>
            <Text style={styles.timeText}>{formatRequestTime(createdAt)}</Text>
          </View>
        </Pressable>

        <View style={styles.actionNotch}>
          {loading ? (
            <ActivityIndicator color={colors.blue} style={{ marginRight: 6 }} />
          ) : direction === 'received' ? (
            <>
              <Pressable
                accessibilityLabel="Accept request"
                onPress={() =>
                  void run(() => acceptConnection(connectionId, { fullName: person.fullName }), {
                    connectionId,
                    connectionStatus: 'ACCEPTED',
                    connectionDirection: null,
                  })
                }
                style={[styles.actionBtn, styles.acceptBtn]}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </Pressable>
              <Pressable
                accessibilityLabel="Decline request"
                onPress={() =>
                  void run(() => rejectConnection(connectionId), {
                    connectionId: '',
                    connectionStatus: 'NONE',
                    connectionDirection: null,
                  })
                }
                style={[styles.actionBtn, styles.rejectBtn]}
              >
                <Ionicons name="close" size={16} color={colors.heading} />
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityLabel="Cancel request"
              onPress={() =>
                void run(() => cancelConnection(connectionId), {
                  connectionId: '',
                  connectionStatus: 'NONE',
                  connectionDirection: null,
                })
              }
              style={[styles.actionBtn, styles.rejectBtn]}
            >
              <Ionicons name="close" size={16} color={colors.heading} />
            </Pressable>
          )}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
