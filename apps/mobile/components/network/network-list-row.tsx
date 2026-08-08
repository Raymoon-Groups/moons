import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NetworkUserCard } from '@moons/shared';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import type { ConnectionUpdate } from '@/components/network/person-card';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  acceptConnection,
  cancelConnection,
  rejectConnection,
} from '@/lib/network';
import {
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { fetchConversationWithUser } from '@/lib/messages';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function NetworkListRow({
  person,
  onConnectionChange,
  onUpdated,
  showConnect = true,
  isLast = false,
  variant = 'compact',
}: {
  person: NetworkUserCard;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onUpdated?: () => void;
  showConnect?: boolean;
  isLast?: boolean;
  /** `detail` = richer row for the connections page */
  variant?: 'compact' | 'detail';
}) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [local, setLocal] = useState(person);

  useEffect(() => {
    setLocal(person);
  }, [person]);

  const avatar = resolveAvatarUrl(local.avatarUrl);
  const name = local.fullName?.trim() || 'Professional';
  const subtitle = local.headline || local.currentCompany || 'Professional';
  const company = local.currentCompany && local.headline ? local.currentCompany : local.location || '';
  const detail = variant === 'detail';

  function apply(update: ConnectionUpdate) {
    setLocal((prev) => ({
      ...prev,
      connectionStatus: update.connectionStatus,
      connectionId: update.connectionId || null,
      connectionDirection: update.connectionDirection,
    }));
    onConnectionChange?.(local.userId, update);
  }

  async function run(action: () => Promise<unknown>, update?: ConnectionUpdate) {
    setLoading(true);
    setError('');
    try {
      await action();
      if (update) apply(update);
      notifyConnectionsRefresh();
      onUpdated?.();
    } catch (err) {
      if (update && isStaleConnectionInviteError(err)) {
        apply(update);
        notifyConnectionsRefresh();
        return;
      }
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  function openProfile() {
    router.push(`/network/${local.userId}` as never);
  }

  async function openMessage() {
    try {
      const conv = await fetchConversationWithUser(local.userId);
      router.push(`/messages/${conv.id}` as never);
    } catch {
      openProfile();
    }
  }

  function renderActions() {
    if (local.connectionStatus === 'ACCEPTED') {
      if (detail) {
        return (
          <View style={styles.detailActions}>
            <Pressable
              onPress={() => void openMessage()}
              style={[styles.iconBtn, { backgroundColor: colors.blue }]}
              accessibilityLabel="Message"
            >
              <Ionicons name="chatbubble" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={openProfile}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              accessibilityLabel="View profile"
            >
              <Ionicons name="person-outline" size={16} color={colors.heading} />
            </Pressable>
          </View>
        );
      }
      return (
        <Pressable
          onPress={() => void openMessage()}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[{ color: colors.heading, fontSize: 13 }, fontStyle('semibold')]}>Message</Text>
        </Pressable>
      );
    }

    if (local.connectionStatus === 'PENDING' && local.connectionDirection === 'received' && local.connectionId) {
      return (
        <View style={styles.actionStack}>
          <Pressable
            disabled={loading}
            onPress={() =>
              void run(
                () => acceptConnection(local.connectionId!, { fullName: local.fullName }),
                { connectionId: local.connectionId!, connectionStatus: 'ACCEPTED', connectionDirection: null },
              )
            }
            style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.blue }]}
          >
            <Text style={[styles.actionBtnPrimaryText, fontStyle('bold')]}>Confirm</Text>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() =>
              void run(
                () => rejectConnection(local.connectionId!),
                { connectionId: '', connectionStatus: 'NONE', connectionDirection: null },
              )
            }
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Text style={[{ color: colors.heading, fontSize: 13 }, fontStyle('semibold')]}>Delete</Text>
          </Pressable>
        </View>
      );
    }

    if (local.connectionStatus === 'PENDING') {
      return (
        <Pressable
          disabled={loading}
          onPress={() =>
            local.connectionId
              ? void run(
                  () => cancelConnection(local.connectionId!),
                  { connectionId: '', connectionStatus: 'NONE', connectionDirection: null },
                )
              : undefined
          }
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[{ color: colors.muted, fontSize: 13 }, fontStyle('semibold')]}>Requested</Text>
        </Pressable>
      );
    }

    if (!showConnect) return null;

    return (
      <Pressable
        disabled={loading}
        onPress={() => setShowInvite(true)}
        style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.blue }]}
      >
        <Text style={[styles.actionBtnPrimaryText, fontStyle('bold')]}>Connect</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        detail && styles.rowDetail,
        isLast && styles.rowLast,
        !isLast && { borderBottomColor: colors.border },
      ]}
    >
      <Pressable onPress={openProfile} style={styles.profileTap}>
        <View
          style={[
            styles.avatar,
            detail && styles.avatarDetail,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={[fontStyle('bold'), { fontSize: detail ? 18 : 16, color: colors.heading }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[{ color: colors.heading, fontSize: 15 }, fontStyle('bold')]}>
            {name}
          </Text>
          <Text numberOfLines={1} style={[{ color: colors.muted, fontSize: 12, marginTop: 2 }]}>
            {subtitle}
          </Text>
          {detail && company ? (
            <Text numberOfLines={1} style={[{ color: colors.silver, fontSize: 11, marginTop: 2 }]}>
              {company}
            </Text>
          ) : null}
          {local.connectionStatus === 'PENDING' && local.connectionDirection === 'received' ? (
            <Text style={[{ color: colors.muted, fontSize: 12, marginTop: 4 }]}>
              Sent you a connection request
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        {loading ? <ActivityIndicator color={colors.blue} size="small" /> : renderActions()}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }, fontStyle('medium')]}>{error}</Text>
      ) : null}

      <ConnectInviteModal
        visible={showInvite}
        userId={local.userId}
        fullName={name}
        onClose={() => setShowInvite(false)}
        onSent={(id) =>
          apply({ connectionId: id, connectionStatus: 'PENDING', connectionDirection: 'sent' })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowDetail: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  profileTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDetail: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarImg: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0 },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStack: { gap: 6, alignItems: 'stretch' },
  actionBtn: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnPrimary: { borderWidth: 0 },
  actionBtnPrimaryText: { color: '#fff', fontSize: 13 },
  error: {
    position: 'absolute',
    bottom: 2,
    left: 68,
    fontSize: 11,
  },
});
