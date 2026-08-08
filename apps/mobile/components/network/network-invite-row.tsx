import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { theme } from '@/lib/theme';

export function NetworkInviteRow({
  person,
  connectionId,
  direction,
  onConnectionChange,
  onUpdated,
  isLast = false,
}: {
  person: NetworkUserCard;
  connectionId: string;
  direction: 'received' | 'sent';
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onUpdated?: () => void;
  isLast?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState('');

  const avatar = resolveAvatarUrl(person.avatarUrl);
  const name = person.fullName?.trim() || 'Professional';
  const roleLine = person.headline || person.currentCompany || 'Professional';
  const company = person.currentCompany && person.headline ? person.currentCompany : '';
  const mutual = person.mutualConnections ?? 0;

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
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Pressable style={styles.main} onPress={() => router.push(`/network/${person.userId}` as never)}>
        <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={[{ fontSize: 17, color: colors.heading }, fontStyle('bold')]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.copy}>
          <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.role, { color: colors.muted }]} numberOfLines={1}>
            {roleLine}
          </Text>
          {company ? (
            <Text style={[styles.company, { color: colors.muted }]} numberOfLines={1}>
              {company}
            </Text>
          ) : null}
          <Text style={[styles.mutual, { color: colors.silver }]} numberOfLines={1}>
            {mutual > 0
              ? `${mutual} mutual connection${mutual === 1 ? '' : 's'}`
              : direction === 'sent'
                ? 'Invite sent'
                : 'Wants to connect'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={colors.blue} />
        ) : direction === 'received' ? (
          <>
            <Pressable
              accessibilityLabel="Decline request"
              onPress={() =>
                void run(() => rejectConnection(connectionId), {
                  connectionId: '',
                  connectionStatus: 'NONE',
                  connectionDirection: null,
                })
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.heading} />
            </Pressable>
            <Pressable
              accessibilityLabel="Accept request"
              onPress={() =>
                void run(() => acceptConnection(connectionId, { fullName: person.fullName }), {
                  connectionId,
                  connectionStatus: 'ACCEPTED',
                  connectionDirection: null,
                })
              }
              style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.blue }]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
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
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="close" size={18} color={colors.heading} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, lineHeight: 20 },
  role: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  company: { marginTop: 1, fontSize: 11, lineHeight: 14 },
  mutual: { marginTop: 4, fontSize: 11, lineHeight: 14 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptBtn: {
    borderWidth: 0,
  },
  error: {
    position: 'absolute',
    left: 74,
    bottom: 2,
    fontSize: 10,
  },
});
