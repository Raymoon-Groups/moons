import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NetworkUserCard } from '@moons/shared';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import { resolveAvatarUrl } from '@/lib/assets';
import { fetchConversationWithUser } from '@/lib/messages';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { cancelConnection } from '@/lib/network';
import { OPEN_ON_MOONS_LABEL, showOpenOnMoonsToViewer } from '@/lib/open-on-moons';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type ConnectionUpdate = {
  connectionId: string;
  connectionStatus: string;
  connectionDirection: 'sent' | 'received' | null;
};

export function PersonCard({
  person,
  onConnectionChange,
  onDismiss,
  onUpdated,
  showConnect = true,
}: {
  person: NetworkUserCard;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onDismiss?: () => void;
  onUpdated?: () => void;
  showConnect?: boolean;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [local, setLocal] = useState(person);

  const avatar = resolveAvatarUrl(local.avatarUrl);
  const name = local.fullName?.trim() || 'Professional';
  const subtitle = local.headline || local.currentCompany || 'Professional';
  const skills = local.sharedSkills?.slice(0, 2) ?? [];
  const showOpenBadge = showOpenOnMoonsToViewer(
    local.openToWork,
    user?.role,
    user?.id === local.userId,
  );

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

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Pressable onPress={openProfile} style={styles.profileTap}>
          <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[fontStyle('bold'), { fontSize: 20, color: colors.heading }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.copy}>
            <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.headline, { color: colors.muted }, fontStyle('regular')]} numberOfLines={2}>
              {subtitle}
            </Text>
            {local.recommendationReason ? (
              <Text style={[styles.reason, { color: colors.muted }]} numberOfLines={2}>
                {local.recommendationReason}
              </Text>
            ) : null}
            {showOpenBadge ? (
              <View style={[styles.openBadge, { backgroundColor: '#1a2744' }]}>
                <Text style={[styles.openBadgeText, fontStyle('semibold')]}>{OPEN_ON_MOONS_LABEL}</Text>
              </View>
            ) : null}
            {skills.length > 0 ? (
              <View style={styles.skillRow}>
                {skills.map((skill) => (
                  <View key={skill} style={[styles.skill, { backgroundColor: `${colors.blue}12` }]}>
                    <Text style={{ color: colors.blue, fontSize: 10, ...fontStyle('semibold') }}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Pressable>

        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            style={[styles.dismiss, { backgroundColor: colors.surface }]}
            accessibilityLabel="Dismiss suggestion"
          >
            <Ionicons name="close" size={14} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {local.connectionStatus === 'ACCEPTED' ? (
          <>
            <Pressable
              onPress={() => void openMessage()}
              style={[styles.btnPrimary, { backgroundColor: colors.blue, flex: 1 }]}
            >
              <Ionicons name="chatbubble-outline" size={15} color="#fff" />
              <Text style={[styles.btnPrimaryText, fontStyle('semibold')]}>Message</Text>
            </Pressable>
            <Pressable
              onPress={openProfile}
              style={[styles.btnSecondary, { borderColor: colors.border, flex: 1 }]}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.heading }, fontStyle('semibold')]}>
                View profile
              </Text>
            </Pressable>
          </>
        ) : local.connectionStatus === 'PENDING' && local.connectionDirection === 'received' && local.connectionId ? (
          <>
            <Pressable
              disabled={loading}
              onPress={() =>
                void run(
                  () => acceptConnectionInvite(local.connectionId!),
                  { connectionId: local.connectionId!, connectionStatus: 'ACCEPTED', connectionDirection: null },
                )
              }
              style={[styles.btnPrimary, { backgroundColor: colors.blue, flex: 1 }]}
            >
              <Text style={[styles.btnPrimaryText, fontStyle('semibold')]}>Accept</Text>
            </Pressable>
            <Pressable
              disabled={loading}
              onPress={() =>
                void run(
                  () => ignoreConnectionInvite(local.connectionId!),
                  { connectionId: '', connectionStatus: 'NONE', connectionDirection: null },
                )
              }
              style={[styles.btnSecondary, { borderColor: colors.border, flex: 1 }]}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.heading }, fontStyle('semibold')]}>Ignore</Text>
            </Pressable>
          </>
        ) : local.connectionStatus === 'PENDING' ? (
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
            style={[styles.btnSecondary, { borderColor: colors.border, flex: 1 }]}
          >
            <Text style={[styles.btnSecondaryText, { color: colors.muted }, fontStyle('semibold')]}>Pending</Text>
          </Pressable>
        ) : (
          showConnect ? (
          <Pressable
            disabled={loading}
            onPress={() => setShowInvite(true)}
            style={[styles.btnPrimary, { backgroundColor: colors.blue, flex: 1 }]}
          >
            <Ionicons name="person-add-outline" size={15} color="#fff" />
            <Text style={[styles.btnPrimaryText, fontStyle('semibold')]}>Connect</Text>
          </Pressable>
          ) : null
        )}
      </View>

      {loading ? <ActivityIndicator style={{ marginBottom: 10 }} color={colors.blue} /> : null}
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

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
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    paddingBottom: 12,
  },
  profileTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0, paddingRight: 4 },
  name: { fontSize: 16, lineHeight: 21 },
  headline: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  reason: { marginTop: 6, fontSize: 12, lineHeight: 17 },
  openBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openBadgeText: { color: '#fff', fontSize: 10 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  skill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 999,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13 },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 13 },
  error: { fontSize: 11, textAlign: 'center', paddingBottom: 10, paddingHorizontal: 14 },
});
