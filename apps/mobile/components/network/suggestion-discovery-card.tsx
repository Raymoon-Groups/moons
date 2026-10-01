import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NetworkUserCard } from '@moons/shared';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import type { ConnectionUpdate } from '@/components/network/person-card';
import { resolveAvatarUrl, resolveAssetUrl } from '@/lib/assets';
import { notifyConnectionsRefresh } from '@/lib/connection-invites';
import { cancelConnection } from '@/lib/network';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const COVER_FALLBACK_LIGHT: [string, string] = ['#EEF1F4', '#E4E8ED'];
const COVER_FALLBACK_DARK: [string, string] = ['#2A3340', '#1F2732'];

function CardCover({
  bannerUrl,
  isDark,
}: {
  bannerUrl?: string | null;
  isDark: boolean;
}) {
  const cover = resolveAssetUrl(bannerUrl);
  const fallback = isDark ? COVER_FALLBACK_DARK : COVER_FALLBACK_LIGHT;

  return (
    <View style={[styles.banner, { backgroundColor: fallback[0] }]}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.bannerImg} contentFit="cover" transition={200} />
      ) : (
        <LinearGradient
          colors={fallback}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

export function SuggestionDiscoveryCard({
  person,
  onConnectionChange,
  onDismiss,
  onUpdated,
  layout = 'carousel',
}: {
  person: NetworkUserCard;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onDismiss?: () => void;
  onUpdated?: () => void;
  /** `carousel` = fixed width for horizontal scrolls; `grid` = fills column */
  layout?: 'carousel' | 'grid';
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
  const reason =
    mutual > 0
      ? `${mutual} mutual connection${mutual === 1 ? '' : 's'}`
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

  const chipBg = isDark ? colors.surface : '#F2F4F6';
  const chipFg = colors.muted;
  const avatarFallbackBg = isDark ? colors.surface : '#F2F4F6';

  return (
    <View
      style={[
        styles.card,
        layout === 'carousel' ? styles.cardCarousel : styles.cardGrid,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        theme.shadow.soft,
      ]}
    >
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={[
            styles.dismiss,
            {
              backgroundColor: isDark ? 'rgba(15,28,51,0.55)' : 'rgba(255,255,255,0.92)',
            },
          ]}
          accessibilityLabel="Dismiss suggestion"
        >
          <Ionicons name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}

      <Pressable onPress={openProfile} style={styles.tapArea}>
        <CardCover bannerUrl={local.bannerUrl} isDark={isDark} />

        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarRing,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.surfaceElevated,
              },
            ]}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: avatarFallbackBg }]}>
                <Text style={[{ fontSize: 22, color: colors.muted }, fontStyle('bold')]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
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

          <View style={[styles.reasonChip, { backgroundColor: chipBg }]}>
            <Ionicons name="people-outline" size={12} color={chipFg} />
            <Text style={[styles.reasonText, { color: chipFg }, fontStyle('semibold')]} numberOfLines={1}>
              {reason}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={colors.heading} />
        ) : status === 'PENDING' && local.connectionDirection === 'sent' ? (
          <Pressable
            onPress={() => void cancelPending()}
            style={[
              styles.btnOutline,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface : '#F7F8FA',
              },
            ]}
          >
            <Text style={[styles.btnOutlineText, { color: colors.muted }, fontStyle('semibold')]}>Pending</Text>
          </Pressable>
        ) : status === 'ACCEPTED' ? (
          <Pressable
            onPress={openProfile}
            style={[
              styles.btnOutline,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface : '#F7F8FA',
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={15} color={colors.heading} />
            <Text style={[styles.btnOutlineText, { color: colors.heading }, fontStyle('semibold')]}>
              Connected
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setShowInvite(true)} style={styles.btnFilled}>
            <LinearGradient
              colors={[colors.blue, colors.blueDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Ionicons name="person-add" size={14} color="#fff" />
              <Text style={[styles.btnFilledText, fontStyle('bold')]}>Connect</Text>
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
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardCarousel: {
    width: 168,
    marginRight: 12,
  },
  cardGrid: {
    flex: 1,
  },
  dismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tapArea: {
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 96,
    overflow: 'hidden',
  },
  bannerImg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  avatarWrap: {
    marginTop: -30,
    marginBottom: 8,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    width: '100%',
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 86,
  },
  name: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  title: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  company: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  reasonChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  reasonText: {
    flexShrink: 1,
    fontSize: 10,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  btnFilled: {
    height: 36,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnFilledText: {
    color: '#fff',
    fontSize: 13,
  },
  btnOutline: {
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  btnOutlineText: {
    fontSize: 13,
  },
});
