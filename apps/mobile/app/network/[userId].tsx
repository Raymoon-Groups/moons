import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { ProfilePostsSection } from '@/components/feed/profile-posts-section';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import {
  ProfileContentTabs,
  PUBLIC_PROFILE_TABS,
  type ProfileContentTab,
} from '@/components/profile/profile-content-tabs';
import { ProfileHeroCard } from '@/components/profile/profile-hero-card';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { fontStyle } from '@/lib/font-style';
import {
  acceptConnection,
  cancelConnection,
  fetchNetworkProfile,
  rejectConnection,
  removeConnection,
  type NetworkProfileResponse,
} from '@/lib/network';
import { OPEN_ON_MOONS_TAGLINE, showOpenOnMoonsToViewer } from '@/lib/open-on-moons';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const PROFILE_WEB_BASE = 'https://moonsjob.com/network';

function ActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  flex = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  flex?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: isPrimary
          ? colors.blue
          : isGhost
            ? 'transparent'
            : isDark
              ? colors.surface
              : '#F3F6FA',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isGhost ? 'transparent' : isDark ? colors.border : colors.borderSubtle,
        opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        minHeight: 46,
      })}
    >
      {icon ? (
        <Ionicons name={icon} size={17} color={isPrimary ? '#fff' : colors.heading} />
      ) : null}
      <Text
        style={{
          color: isPrimary ? '#fff' : isGhost ? colors.muted : colors.heading,
          fontSize: 14,
          ...fontStyle('semibold'),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        backgroundColor: isDark ? colors.surfaceElevated : '#fff',
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
        ...theme.shadow.soft,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 6,
          ...fontStyle('semibold'),
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

function EmptyPane({
  icon,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        backgroundColor: isDark ? colors.surfaceElevated : '#fff',
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
        ...theme.shadow.soft,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
          marginBottom: 12,
        }}
      >
        <Ionicons name={icon} size={24} color={colors.blue} />
      </View>
      <Text
        style={{
          color: colors.muted,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
          ...fontStyle('medium'),
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export default function NetworkProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding(24);
  const [data, setData] = useState<NetworkProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<ProfileContentTab>('general');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await fetchNetworkProfile(userId);
      setData(next);
      setBannerUrl((next.profile.bannerUrl as string | null) ?? null);
      setBannerUpdatedAt((next.profile.updatedAt as string | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile unavailable');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId || !user?.id) return;
    if (userId === user.id) {
      router.replace('/(tabs)/profile' as never);
    }
  }, [userId, user?.id]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: {
          backgroundColor: isDark ? colors.background : '#F7FAFC',
        },
        container: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomPadding,
        },
        actionRow: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 12,
        },
        statsCard: {
          flexDirection: 'row',
          borderRadius: 18,
          paddingVertical: 14,
          marginBottom: 14,
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          ...theme.shadow.soft,
        },
        statCell: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        statDivider: {
          width: StyleSheet.hairlineWidth,
          backgroundColor: isDark ? colors.border : colors.borderSubtle,
        },
        statValue: {
          fontSize: 18,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        statLabel: {
          marginTop: 2,
          fontSize: 11,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        openBadge: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
          marginTop: -4,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
        },
        openBadgeText: {
          color: colors.blue,
          fontSize: 12,
          ...fontStyle('semibold'),
        },
        limitedCard: {
          borderRadius: 20,
          padding: 18,
          marginBottom: 12,
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          ...theme.shadow.soft,
        },
        timelineItem: {
          paddingBottom: 14,
          marginBottom: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? colors.border : colors.borderSubtle,
        },
        timelineItemLast: {
          paddingBottom: 0,
          marginBottom: 0,
          borderBottomWidth: 0,
        },
        timelineTitle: {
          fontSize: 15,
          color: colors.heading,
          ...fontStyle('semibold'),
        },
        timelineSubtitle: {
          fontSize: 13.5,
          color: colors.foreground,
          marginTop: 3,
        },
        timelineMeta: {
          fontSize: 12,
          color: colors.muted,
          marginTop: 4,
        },
        timelineDesc: {
          fontSize: 13.5,
          color: colors.muted,
          marginTop: 8,
          lineHeight: 20,
        },
        skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
        skill: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: isDark ? `${colors.blue}18` : `${colors.blue}12`,
        },
        mutualRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
        },
        mutualAvatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
        },
        mutualAvatarImg: { width: '100%', height: '100%' },
        mutualStrip: {
          borderRadius: 18,
          padding: 14,
          marginBottom: 14,
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          ...theme.shadow.soft,
        },
        mutualStripTop: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        avatarStack: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        stackAvatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: isDark ? colors.surfaceElevated : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: isDark ? `${colors.blue}28` : `${colors.blue}16`,
        },
        mutualStripTitle: {
          fontSize: 14,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        mutualStripSub: {
          fontSize: 12,
          color: colors.muted,
          marginTop: 2,
          ...fontStyle('medium'),
        },
        mutualChipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 12,
        },
        mutualChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingVertical: 6,
          paddingHorizontal: 10,
          paddingRight: 12,
          borderRadius: 999,
          backgroundColor: isDark ? colors.surface : `${colors.blue}0C`,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.borderSubtle,
        },
        mutualChipAvatar: {
          width: 22,
          height: 22,
          borderRadius: 11,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? `${colors.blue}28` : `${colors.blue}16`,
        },
        mutualChipName: {
          fontSize: 12,
          color: colors.heading,
          maxWidth: 100,
          ...fontStyle('semibold'),
        },
        error: {
          color: colors.error,
          textAlign: 'center',
          marginTop: 8,
        },
      }),
    [bottomPadding, colors, isDark],
  );

  async function runAction(action: () => Promise<unknown>) {
    setActionLoading(true);
    setError('');
    try {
      await action();
      notifyConnectionsRefresh();
      await load();
    } catch (err) {
      if (!isStaleConnectionInviteError(err)) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } else {
        await load();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function shareProfile(name: string, headline: string | null) {
    const url = `${PROFILE_WEB_BASE}/${userId}`;
    try {
      await Share.share({
        title: `${name} on MoonsJob`,
        message: `${headline ?? `View ${name}'s professional profile`}\n${url}`,
        url,
      });
    } catch {
      Alert.alert('Could not share', 'Try again in a moment.');
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? colors.background : '#F7FAFC',
          }}
        >
          <ActivityIndicator color={colors.blue} size="large" />
          <Text style={{ marginTop: 12, color: colors.muted, ...fontStyle('medium') }}>
            Loading profile…
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: isDark ? colors.background : '#F7FAFC',
          }}
        >
          <EmptyPane
            icon="person-outline"
            message={error || 'This professional profile is unavailable.'}
          />
        </View>
      </AppScreen>
    );
  }

  const profile = data.profile;
  const name = profile.fullName?.trim() || 'Professional';
  const headline = (profile.headline as string | null) ?? null;
  const skills = (profile.skills as string[] | undefined) ?? [];
  const limited = Boolean(profile.limited);
  const firstName = name.split(' ')[0] || name;
  const preferredRoles = Array.isArray(profile.preferredRoles)
    ? (profile.preferredRoles as string[])
    : [];
  const preferredLocations = Array.isArray(profile.preferredLocations)
    ? (profile.preferredLocations as string[])
    : [];
  const workExperiences = Array.isArray(profile.workExperiences)
    ? (profile.workExperiences as WorkExperienceEntry[])
    : [];
  const educations = Array.isArray(profile.educations)
    ? (profile.educations as EducationEntry[])
    : [];
  const certifications = Array.isArray(profile.certifications)
    ? (profile.certifications as CertificationEntry[])
    : [];
  const isOwnProfile = user?.id === profile.userId;
  const showOpenBadge = showOpenOnMoonsToViewer(
    Boolean(profile.openToWork),
    user?.role,
    isOwnProfile,
  );
  const company = (profile.currentCompany as string | null) ?? null;
  const location = profile.location ? String(profile.location) : null;
  const heroTitle = [headline, company].filter(Boolean).join(' · ') || null;

  return (
    <AppScreen>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeroCard
          name={name}
          title={heroTitle}
          location={location}
          avatarUrl={profile.avatarUrl as string | null}
          bannerUrl={bannerUrl}
          bannerUpdatedAt={bannerUpdatedAt}
          editable={false}
        />

        {showOpenBadge ? (
          <View style={styles.openBadge}>
            <Ionicons name="briefcase" size={13} color={colors.blue} />
            <Text style={styles.openBadgeText}>{OPEN_ON_MOONS_TAGLINE}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {data.connectionStatus === 'ACCEPTED' ? (
            <>
              <ActionButton
                flex
                label="Message"
                icon="chatbubble-ellipses-outline"
                onPress={() => router.push(`/messages?with=${userId}` as never)}
              />
              <ActionButton
                flex
                label="Share"
                icon="share-social-outline"
                variant="secondary"
                onPress={() => void shareProfile(name, headline)}
              />
            </>
          ) : data.connectionStatus === 'PENDING' &&
            data.connectionDirection === 'received' &&
            data.connectionId ? (
            <>
              <ActionButton
                flex
                label="Accept"
                icon="checkmark"
                disabled={actionLoading}
                onPress={() =>
                  void runAction(() => acceptConnection(data.connectionId!, { fullName: name }))
                }
              />
              <ActionButton
                flex
                label="Ignore"
                variant="secondary"
                disabled={actionLoading}
                onPress={() => void runAction(() => rejectConnection(data.connectionId!))}
              />
            </>
          ) : data.connectionStatus === 'PENDING' && data.connectionId ? (
            <>
              <ActionButton
                flex
                label="Withdraw"
                icon="close-outline"
                variant="secondary"
                disabled={actionLoading}
                onPress={() => void runAction(() => cancelConnection(data.connectionId!))}
              />
              <ActionButton
                flex
                label="Share"
                icon="share-social-outline"
                variant="secondary"
                onPress={() => void shareProfile(name, headline)}
              />
            </>
          ) : (
            <>
              {!isOwnProfile ? (
                <ActionButton
                  flex
                  label="Connect"
                  icon="person-add-outline"
                  onPress={() => setShowInvite(true)}
                />
              ) : null}
              <ActionButton
                flex
                label="Share"
                icon="share-social-outline"
                variant="secondary"
                onPress={() => void shareProfile(name, headline)}
              />
            </>
          )}
        </View>

        {data.connectionStatus === 'ACCEPTED' && !isOwnProfile ? (
          <View style={{ marginBottom: 12, marginTop: -4 }}>
            <ActionButton
              label="Remove connection"
              icon="person-remove-outline"
              variant="ghost"
              disabled={actionLoading}
              onPress={() => {
                Alert.alert('Remove connection', `Remove ${name} from your connections?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () =>
                      void runAction(() => removeConnection(userId!, { fullName: name })),
                  },
                ]);
              }}
            />
          </View>
        ) : null}

        <View style={styles.statsCard}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{data.connectionCount}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{data.mutualConnections.count}</Text>
            <Text style={styles.statLabel}>Mutual</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{workExperiences.length || '—'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {data.mutualConnections.count > 0 ? (
          <View style={styles.mutualStrip}>
            <View style={styles.mutualStripTop}>
              <View style={styles.avatarStack}>
                {data.mutualConnections.items.slice(0, 3).map((person, index) => {
                  const mutualAvatar = resolveAvatarUrl(person.avatarUrl);
                  return (
                    <View
                      key={person.userId}
                      style={[styles.stackAvatar, index > 0 && { marginLeft: -10 }]}
                    >
                      {mutualAvatar ? (
                        <Image
                          source={{ uri: mutualAvatar }}
                          style={styles.mutualAvatarImg}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('bold') }}>
                          {(person.fullName ?? '?').charAt(0)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.mutualStripTitle}>
                  {data.mutualConnections.count} mutual connection
                  {data.mutualConnections.count === 1 ? '' : 's'}
                </Text>
                <Text style={styles.mutualStripSub} numberOfLines={1}>
                  {data.mutualConnections.items
                    .slice(0, 2)
                    .map((p) => p.fullName?.split(' ')[0] || 'Member')
                    .join(', ')}
                  {data.mutualConnections.count > 2
                    ? ` +${data.mutualConnections.count - 2} more`
                    : ''}
                </Text>
              </View>
            </View>

            {data.mutualConnections.items.length > 0 ? (
              <View style={styles.mutualChipRow}>
                {data.mutualConnections.items.slice(0, 6).map((person) => {
                  const mutualAvatar = resolveAvatarUrl(person.avatarUrl);
                  return (
                    <Pressable
                      key={person.userId}
                      onPress={() => {
                        if (user?.id && person.userId === user.id) {
                          router.push('/(tabs)/profile' as never);
                          return;
                        }
                        router.push(`/network/${person.userId}` as never);
                      }}
                      style={styles.mutualChip}
                    >
                      <View style={styles.mutualChipAvatar}>
                        {mutualAvatar ? (
                          <Image
                            source={{ uri: mutualAvatar }}
                            style={styles.mutualAvatarImg}
                            contentFit="cover"
                          />
                        ) : (
                          <Text style={{ color: colors.blue, fontSize: 10, ...fontStyle('bold') }}>
                            {(person.fullName ?? '?').charAt(0)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.mutualChipName} numberOfLines={1}>
                        {person.fullName?.split(' ')[0] || 'Member'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {limited ? (
          <View style={styles.limitedCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Ionicons name="lock-closed" size={18} color={colors.blue} />
              <Text style={{ color: colors.heading, fontSize: 15, ...fontStyle('bold') }}>
                Limited profile
              </Text>
            </View>
            <Text style={{ color: colors.muted, lineHeight: 21, fontSize: 14 }}>
              Connect with {firstName} to view their full experience, education, and activity.
            </Text>
          </View>
        ) : (
          <>
            <ProfileContentTabs
              value={contentTab}
              onChange={setContentTab}
              tabs={PUBLIC_PROFILE_TABS}
            />

            {contentTab === 'general' ? (
              <View>
                <ProfilePostsSection
                  userId={profile.userId}
                  emptyMessage={`${firstName} has not posted anything yet.`}
                />
              </View>
            ) : null}

            {contentTab === 'personal' ? (
              <View>
                {(preferredRoles.length > 0 || preferredLocations.length > 0) && (
                  <InfoCard title="Open to opportunities">
                    {preferredRoles.length > 0 ? (
                      <Text
                        style={{
                          color: colors.heading,
                          fontSize: 15,
                          lineHeight: 22,
                          ...fontStyle('medium'),
                        }}
                      >
                        {preferredRoles.join(' · ')}
                      </Text>
                    ) : null}
                    {preferredLocations.length > 0 ? (
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 13,
                          marginTop: 6,
                          lineHeight: 18,
                        }}
                      >
                        {preferredLocations.join(' · ')}
                      </Text>
                    ) : null}
                  </InfoCard>
                )}

                {profile.summary ? (
                  <InfoCard title="About">
                    <Text
                      style={{
                        color: colors.heading,
                        lineHeight: 22,
                        fontSize: 15,
                        ...fontStyle('regular'),
                      }}
                    >
                      {String(profile.summary)}
                    </Text>
                  </InfoCard>
                ) : null}

                {data.sharedSkills.length > 0 ? (
                  <InfoCard title="Shared skills">
                    <View style={styles.skills}>
                      {data.sharedSkills.map((skill) => (
                        <View key={skill} style={styles.skill}>
                          <Text
                            style={{ color: colors.blue, fontSize: 12.5, ...fontStyle('semibold') }}
                          >
                            {skill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </InfoCard>
                ) : null}

                {skills.length > 0 ? (
                  <InfoCard title="Skills">
                    <View style={styles.skills}>
                      {skills.map((skill) => (
                        <View key={skill} style={styles.skill}>
                          <Text
                            style={{ color: colors.blue, fontSize: 12.5, ...fontStyle('semibold') }}
                          >
                            {skill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </InfoCard>
                ) : null}

                {!profile.summary &&
                skills.length === 0 &&
                data.sharedSkills.length === 0 &&
                preferredRoles.length === 0 &&
                preferredLocations.length === 0 ? (
                  <EmptyPane
                    icon="person-outline"
                    message={`${firstName} has not added about details yet.`}
                  />
                ) : null}
              </View>
            ) : null}

            {contentTab === 'background' ? (
              <View>
                {workExperiences.length > 0 ? (
                  <InfoCard
                    title="Experience"
                    subtitle={`${workExperiences.length} position${workExperiences.length === 1 ? '' : 's'}`}
                  >
                    {workExperiences.map((exp, index) => (
                      <View
                        key={index}
                        style={[
                          styles.timelineItem,
                          index === workExperiences.length - 1 && styles.timelineItemLast,
                        ]}
                      >
                        <Text style={styles.timelineTitle}>{exp.designation || 'Role'}</Text>
                        {exp.company ? (
                          <Text style={styles.timelineSubtitle}>{exp.company}</Text>
                        ) : null}
                        <Text style={styles.timelineMeta}>
                          {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                        </Text>
                        {exp.description ? (
                          <Text style={styles.timelineDesc}>{exp.description}</Text>
                        ) : null}
                      </View>
                    ))}
                  </InfoCard>
                ) : null}

                {educations.length > 0 ? (
                  <InfoCard title="Education">
                    {educations.map((edu, index) => (
                      <View
                        key={index}
                        style={[
                          styles.timelineItem,
                          index === educations.length - 1 && styles.timelineItemLast,
                        ]}
                      >
                        <Text style={styles.timelineTitle}>{edu.institute || 'Institution'}</Text>
                        <Text style={styles.timelineSubtitle}>
                          {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}
                        </Text>
                        {edu.year ? <Text style={styles.timelineMeta}>{edu.year}</Text> : null}
                      </View>
                    ))}
                  </InfoCard>
                ) : null}

                {certifications.length > 0 ? (
                  <InfoCard title="Licenses & certifications">
                    {certifications.map((cert, index) => (
                      <View
                        key={index}
                        style={[
                          styles.timelineItem,
                          index === certifications.length - 1 && styles.timelineItemLast,
                        ]}
                      >
                        <Text style={styles.timelineTitle}>{cert.name || 'Certification'}</Text>
                        {cert.issuer ? (
                          <Text style={styles.timelineSubtitle}>{cert.issuer}</Text>
                        ) : null}
                        {cert.year ? <Text style={styles.timelineMeta}>{cert.year}</Text> : null}
                      </View>
                    ))}
                  </InfoCard>
                ) : null}

                {workExperiences.length === 0 &&
                educations.length === 0 &&
                certifications.length === 0 ? (
                  <EmptyPane
                    icon="school-outline"
                    message={`${firstName} has not added qualifications yet.`}
                  />
                ) : null}
              </View>
            ) : null}
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <ConnectInviteModal
        visible={showInvite}
        userId={userId!}
        fullName={name}
        onClose={() => setShowInvite(false)}
        onSent={() => {
          setShowInvite(false);
          void load();
        }}
      />
    </AppScreen>
  );
}
