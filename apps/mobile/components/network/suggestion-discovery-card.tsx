import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NetworkUserCard } from '@moons/shared';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import type { ConnectionUpdate } from '@/components/network/person-card';
import { resolveAvatarUrl } from '@/lib/assets';
import { notifyConnectionsRefresh } from '@/lib/connection-invites';
import { cancelConnection } from '@/lib/network';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function SuggestionDiscoveryCard({
  person,
  onConnectionChange,
  onDismiss,
  onUpdated,
}: {
  person: NetworkUserCard;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onDismiss?: () => void;
  onUpdated?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [local, setLocal] = useState(person);

  useEffect(() => {
    setLocal(person);
  }, [person]);

  const avatar = resolveAvatarUrl(local.avatarUrl);
  const name = local.fullName?.trim() || 'Professional';
  const title = local.headline || 'Professional';
  const company = local.currentCompany || local.location || '';
  const mutual = local.mutualConnections ?? 0;
  const status = local.connectionStatus || 'NONE';
  const skills = local.sharedSkills?.slice(0, 2) ?? [];
  const reason =
    mutual > 0
      ? `${mutual} mutual${mutual === 1 ? '' : 's'}`
      : local.recommendationReason || 'Suggested for you';

  function apply(update: ConnectionUpdate) {
    setLocal((prev) => ({
      ...prev,
      connectionStatus: update.connectionStatus,
      connectionId: update.connectionId || null,
      connectionDirection: update.connectionDirection,
    }));
    onConnectionChange?.(local.userId, update);
  }

  async function cancelPending() {
    if (!local.connectionId) return;
    setLoading(true);
    try {
      await cancelConnection(local.connectionId);
      apply({ connectionId: '', connectionStatus: 'NONE', connectionDirection: null });
      notifyConnectionsRefresh();
      onUpdated?.();
    } catch {
      // keep card
    } finally {
      setLoading(false);
    }
  }

  function openProfile() {
    router.push(`/network/${local.userId}` as never);
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        theme.shadow.soft,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: colors.blue }]} />

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={[styles.dismiss, { backgroundColor: isDark ? colors.surface : `${colors.blue}12` }]}
          accessibilityLabel="Dismiss suggestion"
        >
          <Ionicons name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}

      <Pressable style={styles.content} onPress={() => router.push(`/network/${local.userId}` as never)}>
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[colors.blue, '#6b9ae8', colors.blueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.surfaceElevated }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[{ fontSize: 18, color: colors.heading }, fontStyle('bold')]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </LinearGradient>
          <View style={[styles.moonDot, { backgroundColor: colors.blue, borderColor: colors.surfaceElevated }]} />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.title, { color: colors.muted }]} numberOfLines={2}>
            {title}
          </Text>
          {company ? (
            <Text style={[styles.company, { color: colors.silver }]} numberOfLines={1}>
              {company}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: isDark ? colors.surface : `${colors.blue}12` }]}>
              <Ionicons name="sparkles" size={11} color={colors.blue} />
              <Text style={[styles.chipText, { color: colors.blue }, fontStyle('semibold')]} numberOfLines={1}>
                {reason}
              </Text>
            </View>
            {skills.map((skill) => (
              <View
                key={skill}
                style={[styles.skillChip, { backgroundColor: isDark ? colors.surface : colors.surfaceHover }]}
              >
                <Text style={[{ color: colors.muted, fontSize: 10 }, fontStyle('semibold')]} numberOfLines={1}>
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={colors.blue} />
        ) : status === 'PENDING' && local.connectionDirection === 'sent' ? (
          <Pressable
            onPress={() => void cancelPending()}
            style={[
              styles.connectBtn,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface : `${colors.blue}08`,
              },
            ]}
          >
            <Text style={[styles.connectText, { color: colors.muted }, fontStyle('semibold')]}>Pending</Text>
          </Pressable>
        ) : status === 'ACCEPTED' ? (
          <Pressable
            onPress={openProfile}
            style={[
              styles.connectBtn,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface : `${colors.blue}08`,
              },
            ]}
          >
            <Text style={[styles.connectText, { color: colors.heading }, fontStyle('semibold')]}>Connected</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setShowInvite(true)} style={styles.connectBtnFilled}>
            <LinearGradient
              colors={[colors.blue, '#6b9ae8', colors.blueDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.connectGradient}
            >
              <Ionicons name="person-add" size={14} color="#fff" />
              <Text style={[styles.connectFilledText, fontStyle('bold')]}>Connect</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      <ConnectInviteModal
        visible={showInvite}
        userId={local.userId}
        fullName={name}
        onClose={() => setShowInvite(false)}
        onSent={(connectionId) => {
          apply({
            connectionId,
            connectionStatus: 'PENDING',
            connectionDirection: 'sent',
          });
          setShowInvite(false);
          onUpdated?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginRight: 12,
    minHeight: 118,
  },
  accent: {
    width: 4,
  },
  dismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 8,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    flexShrink: 0,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  moonDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: { fontSize: 15, lineHeight: 20 },
  title: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  company: { marginTop: 2, fontSize: 11, lineHeight: 14 },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 10,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    maxWidth: 72,
  },
  footer: {
    justifyContent: 'center',
    paddingRight: 12,
    paddingVertical: 12,
    flexShrink: 0,
  },
  connectBtn: {
    minWidth: 88,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnFilled: {
    minWidth: 88,
    height: 36,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  connectGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  connectText: {
    fontSize: 12,
  },
  connectFilledText: {
    color: '#fff',
    fontSize: 12,
  },
});
