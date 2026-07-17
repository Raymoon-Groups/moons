import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnection,
  cancelConnection,
  fetchNetworkProfile,
  rejectConnection,
  removeConnection,
  type NetworkProfileResponse,
} from '@/lib/network';
import {
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { fontStyle } from '@/lib/font-style';
import { OPEN_ON_MOONS_TAGLINE, showOpenOnMoonsToViewer } from '@/lib/open-on-moons';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const PROFILE_WEB_BASE = 'https://moonsjob.com/network';

export default function NetworkProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState<NetworkProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState<string | null>(null);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { paddingBottom: 32 },
        header: { alignItems: 'center', paddingHorizontal: theme.spacing.md, marginTop: -40 },
        avatar: {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: '100%', height: '100%' },
        name: { marginTop: 12, fontSize: 22, textAlign: 'center' },
        badge: {
          marginTop: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: `${colors.blue}18`,
        },
        badgeText: { color: colors.blue, fontSize: 12, ...fontStyle('semibold') },
        actions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          padding: theme.spacing.md,
        },
        btnPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
        btnSecondary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, borderWidth: 1 },
        section: {
          marginHorizontal: theme.spacing.md,
          marginBottom: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: theme.spacing.md,
        },
        sectionTitle: { fontSize: 16, marginBottom: 8 },
        sectionSubtitle: { fontSize: 12, color: colors.muted, marginBottom: 10 },
        timelineItem: { marginBottom: 14 },
        timelineTitle: { fontSize: 14, color: colors.heading, ...fontStyle('semibold') },
        timelineSubtitle: { fontSize: 13, color: colors.foreground, marginTop: 2 },
        timelineMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
        timelineDesc: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 20 },
        mutualRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
        },
        mutualAvatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: colors.surface,
        },
        limitedBox: {
          marginHorizontal: theme.spacing.md,
          marginBottom: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: theme.spacing.md,
        },
        skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        skill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
        error: { color: colors.error, textAlign: 'center', padding: 12 },
      }),
    [colors],
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>{error || 'Profile not found'}</Text>
        </View>
      </AppScreen>
    );
  }

  const profile = data.profile;
  const name = profile.fullName?.trim() || 'Professional';
  const headline = (profile.headline as string | null) ?? null;
  const avatar = resolveAvatarUrl(profile.avatarUrl as string | null);
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

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CoverPhotoBanner
          bannerUrl={bannerUrl}
          updatedAt={bannerUpdatedAt}
          editable={isOwnProfile}
          onUpdated={(nextUrl, updatedAt) => {
            setBannerUrl(nextUrl);
            setBannerUpdatedAt(updatedAt);
          }}
        />
        <View style={styles.header}>
          <View style={[styles.avatar, { borderColor: colors.surfaceElevated, backgroundColor: colors.surface }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[fontStyle('bold'), { fontSize: 28, color: colors.heading }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]}>{name}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
            {headline || (profile.currentCompany as string) || 'Professional'}
          </Text>
          {showOpenBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{OPEN_ON_MOONS_TAGLINE}</Text>
            </View>
          ) : null}
          {profile.location ? (
            <Text style={{ color: colors.muted, marginTop: 6 }}>{String(profile.location)}</Text>
          ) : null}
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
            {data.connectionCount} connections
            {data.mutualConnections.count > 0 ? ` · ${data.mutualConnections.count} mutual` : ''}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => void shareProfile(name, headline)}
            style={[styles.btnSecondary, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Share</Text>
          </Pressable>

          {data.connectionStatus === 'ACCEPTED' ? (
            <>
              <Pressable
                onPress={() => router.push(`/messages?with=${userId}` as never)}
                style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
              >
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Message</Text>
              </Pressable>
              {!isOwnProfile ? (
                <Pressable
                  disabled={actionLoading}
                  onPress={() => void runAction(() => removeConnection(userId!))}
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Remove connection</Text>
                </Pressable>
              ) : null}
            </>
          ) : data.connectionStatus === 'PENDING' && data.connectionDirection === 'received' && data.connectionId ? (
            <>
              <Pressable
                disabled={actionLoading}
                onPress={() => void runAction(() => acceptConnection(data.connectionId!))}
                style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
              >
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Accept</Text>
              </Pressable>
              <Pressable
                disabled={actionLoading}
                onPress={() => void runAction(() => rejectConnection(data.connectionId!))}
                style={[styles.btnSecondary, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Ignore</Text>
              </Pressable>
            </>
          ) : data.connectionStatus === 'PENDING' && data.connectionId ? (
            <Pressable
              disabled={actionLoading}
              onPress={() => void runAction(() => cancelConnection(data.connectionId!))}
              style={[styles.btnSecondary, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.muted, ...fontStyle('semibold') }}>Withdraw request</Text>
            </Pressable>
          ) : !isOwnProfile ? (
            <Pressable
              onPress={() => setShowInvite(true)}
              style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
            >
              <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Connect</Text>
            </Pressable>
          ) : null}
        </View>

        {limited ? (
          <View
            style={[
              styles.limitedBox,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.muted, lineHeight: 22, fontSize: 14 }}>
              This profile is private or only visible to connections. Connect with {firstName} to see
              their full profile.
            </Text>
          </View>
        ) : (
          <>
            {(preferredRoles.length > 0 || preferredLocations.length > 0) && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>
                  Open to opportunities
                </Text>
                {preferredRoles.length > 0 ? (
                  <Text style={{ color: colors.heading, fontSize: 14, ...fontStyle('medium') }}>
                    {preferredRoles.join(' · ')}
                  </Text>
                ) : null}
                {preferredLocations.length > 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    {preferredLocations.join(' · ')}
                  </Text>
                ) : null}
              </View>
            )}

            {profile.summary ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>About</Text>
                <Text style={{ color: colors.muted, lineHeight: 22 }}>{String(profile.summary)}</Text>
              </View>
            ) : null}

            {workExperiences.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Experience</Text>
                <Text style={styles.sectionSubtitle}>
                  {workExperiences.length} position{workExperiences.length === 1 ? '' : 's'}
                </Text>
                {workExperiences.map((exp, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <Text style={styles.timelineTitle}>{exp.designation || 'Role'}</Text>
                    {exp.company ? <Text style={styles.timelineSubtitle}>{exp.company}</Text> : null}
                    <Text style={styles.timelineMeta}>
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </Text>
                    {exp.description ? (
                      <Text style={styles.timelineDesc}>{exp.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {educations.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Education</Text>
                {educations.map((edu, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <Text style={styles.timelineTitle}>{edu.institute || 'Institution'}</Text>
                    <Text style={styles.timelineSubtitle}>
                      {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}
                    </Text>
                    {edu.year ? <Text style={styles.timelineMeta}>{edu.year}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {data.sharedSkills.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Shared skills</Text>
                <View style={styles.skills}>
                  {data.sharedSkills.map((skill) => (
                    <View key={skill} style={[styles.skill, { backgroundColor: `${colors.blue}14` }]}>
                      <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('medium') }}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {skills.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Skills</Text>
                <View style={styles.skills}>
                  {skills.map((skill) => (
                    <View key={skill} style={[styles.skill, { backgroundColor: `${colors.blue}14` }]}>
                      <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('medium') }}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {certifications.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>
                  Licenses & certifications
                </Text>
                {certifications.map((cert, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <Text style={styles.timelineTitle}>{cert.name || 'Certification'}</Text>
                    {cert.issuer ? <Text style={styles.timelineSubtitle}>{cert.issuer}</Text> : null}
                    {cert.year ? <Text style={styles.timelineMeta}>{cert.year}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {data.mutualConnections.items.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>
                  Mutual connections
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {data.mutualConnections.count} mutual connection
                  {data.mutualConnections.count === 1 ? '' : 's'}
                </Text>
                {data.mutualConnections.items.map((person) => {
                  const mutualAvatar = resolveAvatarUrl(person.avatarUrl);
                  return (
                    <Pressable
                      key={person.userId}
                      onPress={() => router.push(`/network/${person.userId}` as never)}
                      style={styles.mutualRow}
                    >
                      <View style={styles.mutualAvatar}>
                        {mutualAvatar ? (
                          <Image source={{ uri: mutualAvatar }} style={styles.avatarImg} contentFit="cover" />
                        ) : (
                          <Text style={{ color: colors.muted, ...fontStyle('semibold') }}>
                            {(person.fullName ?? '?').charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={styles.timelineTitle}>
                          {person.fullName}
                        </Text>
                        {person.headline ? (
                          <Text numberOfLines={1} style={styles.timelineMeta}>
                            {person.headline}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
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
