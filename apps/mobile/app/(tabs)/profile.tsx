import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { MenuRow } from '@/components/menu-row';
import { DisplayStatusToggle } from '@/components/profile/display-status-toggle';
import {
  ProfileEducationCard,
  ProfileWorkCard,
} from '@/components/profile/profile-background-cards';
import {
  ProfileContentTabs,
  type ProfileContentTab,
} from '@/components/profile/profile-content-tabs';
import { ProfileHeroCard } from '@/components/profile/profile-hero-card';
import { ViewableAvatar } from '@/components/profile/protected-avatar-viewer';
import { ProfilePostsSection } from '@/components/feed/profile-posts-section';
import { ProfileRing } from '@/components/profile-ring';
import { PrimaryBanner, SectionTitle } from '@/components/portal-ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useProfile } from '@/lib/use-profile';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const PROFILE_SHORTCUTS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}[] = [
  { key: 'edit', label: 'Edit', icon: 'create-outline', href: '/profile/edit' },
  { key: 'network', label: 'Network', icon: 'people-outline', href: '/(tabs)/network' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', href: '/settings' },
  { key: 'apps', label: 'Applied', icon: 'document-text-outline', href: '/(tabs)/applications' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline', href: '/saved-jobs' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { profile, name, avatarUrl, logoUrl, refresh } = useProfile();
  const bottomPadding = useTabScreenPadding();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const [contentTab, setContentTab] = useState<ProfileContentTab>('background');

  const shortcuts = useMemo(
    () =>
      isRecruiter
        ? PROFILE_SHORTCUTS.filter((item) => item.key !== 'apps' && item.key !== 'saved')
        : PROFILE_SHORTCUTS,
    [isRecruiter],
  );
  const industryLine = profile?.industry?.trim() || '';
  const locationLine = profile?.location?.trim() || '';
  const metaLine = [industryLine, locationLine].filter(Boolean).join(' · ');
  const headline =
    profile?.headline?.trim() ||
    profile?.designation?.trim() ||
    (isRecruiter ? industryLine : null);

  const heroColors = isDark
    ? (['rgba(74, 127, 212, 0.18)', 'rgba(26, 39, 68, 0.5)'] as const)
    : (['rgba(74, 127, 212, 0.12)', 'rgba(238, 242, 247, 0.98)'] as const);

  const latestEducation = profile?.educations?.[0] ?? null;
  const latestWork = profile?.workExperiences?.[0] ?? null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: theme.spacing.md,
          paddingBottom: bottomPadding,
          backgroundColor: isDark ? 'transparent' : '#F7FAFC',
        },
        infoCard: {
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          borderWidth: 0,
          ...theme.shadow.soft,
        },
        infoLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
        infoValue: { fontSize: 15, lineHeight: 22 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
        skillPill: {
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        skillText: { fontSize: 12 },
        themeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 18,
          borderWidth: 0,
          padding: 16,
          marginBottom: 16,
          ...theme.shadow.soft,
        },
        themeCopy: { flex: 1, minWidth: 0 },
        themeLabel: { fontSize: 15 },
        themeHint: { marginTop: 2, fontSize: 12 },
        logout: {
          marginTop: 8,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          paddingVertical: 15,
          alignItems: 'center',
          width: '100%',
        },
        logoutText: { fontSize: 15 },
        shortcutRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
        },
        shortcutItem: {
          flexGrow: 1,
          flexBasis: '18%',
          minWidth: 64,
          maxWidth: '22%',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          paddingVertical: 12,
          paddingHorizontal: 4,
          borderWidth: StyleSheet.hairlineWidth,
          ...theme.shadow.soft,
        },
        shortcutIcon: {
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        },
        shortcutLabel: {
          fontSize: 11,
          textAlign: 'center',
        },
        // recruiter-only below
        hero: {
          alignItems: 'center',
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          paddingTop: theme.spacing.lg,
          paddingHorizontal: 0,
          paddingBottom: 0,
          marginBottom: theme.spacing.lg,
          width: '100%',
          overflow: 'hidden',
        },
        heroBody: {
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          width: '100%',
        },
        name: {
          marginTop: 12,
          fontSize: 22,
          lineHeight: 28,
          textAlign: 'center',
          maxWidth: '100%',
        },
        meta: {
          marginTop: 4,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
        },
        recruiterStrip: {
          width: '100%',
          marginTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        recruiterAvatar: {
          width: 28,
          height: 28,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        recruiterAvatarImg: { width: '100%', height: '100%' },
        recruiterCopy: { flex: 1, minWidth: 0 },
        recruiterLabel: {
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        recruiterName: { fontSize: 14, marginTop: 1 },
      }),
    [bottomPadding, isDark],
  );

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (!user) return null;

  // Recruiter keeps a clearer company-focused layout
  if (isRecruiter) {
    return (
      <AppScreen>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={heroColors} style={[styles.hero, { borderColor: colors.border }]}>
            <View style={styles.heroBody}>
              <ProfileRing
                percent={profile?.completionPercent ?? (user.onboardingCompleted ? 72 : 30)}
                name={companyName}
                avatarUrl={avatarUrl}
                logoUrl={logoUrl}
              />
              <Text numberOfLines={2} style={[styles.name, { color: colors.heading }, fontStyle('extrabold')]}>
                {companyName}
              </Text>
              {metaLine ? (
                <Text numberOfLines={2} style={[styles.meta, { color: colors.muted }, fontStyle('regular')]}>
                  {metaLine}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.recruiterStrip,
                { borderTopColor: `${colors.blue}26`, backgroundColor: `${colors.blue}14` },
              ]}
            >
              <View style={[styles.recruiterAvatar, { backgroundColor: colors.blue }]}>
                <ViewableAvatar uri={avatarUrl} name={name} style={{ width: '100%', height: '100%' }}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.recruiterAvatarImg} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, ...fontStyle('bold') }}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </ViewableAvatar>
              </View>
              <View style={styles.recruiterCopy}>
                <Text style={[styles.recruiterLabel, { color: colors.blue }, fontStyle('semibold')]}>
                  Recruiter
                </Text>
                <Text numberOfLines={1} style={[styles.recruiterName, { color: colors.heading }, fontStyle('bold')]}>
                  {name}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {(profile?.completionPercent ?? 0) < 100 ? (
            <PrimaryBanner
              title="Strengthen your company profile"
              subtitle={`You're at ${profile?.completionPercent ?? 0}% — complete your profile to stand out.`}
              ctaLabel="Edit profile"
              onPress={() => router.push('/profile/edit')}
            />
          ) : null}

          <ProfilePostsSection
            userId={user.id}
            emptyMessage="You have not posted anything yet. Share an update from your feed."
          />

          <SectionTitle>Preferences</SectionTitle>
          <View style={[styles.themeRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.themeCopy}>
              <Text style={[styles.themeLabel, { color: colors.heading }, fontStyle('bold')]}>Appearance</Text>
              <Text style={[styles.themeHint, { color: colors.muted }, fontStyle('regular')]}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
            <ThemeToggle />
          </View>

          <SectionTitle>Account</SectionTitle>
          <MenuRow
            icon="people"
            label="My network"
            subtitle="Connections, pending & visitors"
            onPress={() => router.push('/profile/network')}
          />
          <MenuRow
            icon="settings"
            label="Settings"
            subtitle="Edit profile, security & legal"
            onPress={() => router.push('/settings')}
          />
          <MenuRow
            icon="people"
            label="Browse candidates"
            subtitle="Search talent pool"
            onPress={() => router.push('/recruiter/candidates')}
          />

          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={({ pressed }) => [
              styles.logout,
              { borderColor: 'rgba(248, 113, 113, 0.35)', backgroundColor: colors.errorBg },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={[styles.logoutText, { color: colors.error }, fontStyle('bold')]}>Log out</Text>
          </Pressable>
        </ScrollView>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: isDark ? undefined : '#F7FAFC' }}
      >
        <ProfileHeroCard
          name={name}
          title={headline}
          location={locationLine}
          avatarUrl={avatarUrl}
          bannerUrl={profile?.bannerUrl}
          bannerUpdatedAt={profile?.updatedAt}
          completionPercent={profile?.completionPercent}
          onEdit={() => router.push('/profile/edit')}
          onBannerUpdated={() => {
            void refresh();
          }}
        />

        <View style={styles.shortcutRow}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.shortcutItem,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                  borderColor: colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: `${colors.blue}14` }]}>
                <Ionicons name={item.icon} size={20} color={colors.blue} />
              </View>
              <Text
                numberOfLines={1}
                style={[styles.shortcutLabel, { color: colors.heading }, fontStyle('semibold')]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {profile ? <DisplayStatusToggle profile={profile} onUpdated={() => void refresh()} /> : null}

        <ProfileContentTabs value={contentTab} onChange={setContentTab} />

        {contentTab === 'personal' ? (
          <View>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.muted }, fontStyle('semibold')]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.heading }, fontStyle('medium')]}>{user.email}</Text>
            </View>
            {profile?.phone ? (
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.muted }, fontStyle('semibold')]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.heading }, fontStyle('medium')]}>
                  {profile.phone}
                </Text>
              </View>
            ) : null}
            {profile?.summary ? (
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.muted }, fontStyle('semibold')]}>About</Text>
                <Text style={[styles.infoValue, { color: colors.heading }, fontStyle('regular')]}>
                  {profile.summary}
                </Text>
              </View>
            ) : null}
            {(profile?.skills?.length ?? 0) > 0 ? (
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.muted }, fontStyle('semibold')]}>Skills</Text>
                <View style={styles.skillsWrap}>
                  {profile!.skills.map((skill) => (
                    <View
                      key={skill}
                      style={[styles.skillPill, { backgroundColor: `${colors.blue}14` }]}
                    >
                      <Text style={[styles.skillText, { color: colors.blue }, fontStyle('semibold')]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {contentTab === 'general' ? (
          <View>
            {(profile?.completionPercent ?? 0) < 100 ? (
              <PrimaryBanner
                title="Strengthen your profile"
                subtitle={`You're at ${profile?.completionPercent ?? 0}% — complete your profile to stand out.`}
                ctaLabel="Edit profile"
                onPress={() => router.push('/profile/edit')}
              />
            ) : null}

            <ProfilePostsSection
              userId={user.id}
              emptyMessage="You have not posted anything yet. Share an update from your feed."
            />

            <SectionTitle>Preferences</SectionTitle>
            <View style={[styles.themeRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.themeCopy}>
                <Text style={[styles.themeLabel, { color: colors.heading }, fontStyle('bold')]}>Appearance</Text>
                <Text style={[styles.themeHint, { color: colors.muted }, fontStyle('regular')]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
              <ThemeToggle />
            </View>
          </View>
        ) : null}

        {contentTab === 'background' ? (
          <View>
            <ProfileEducationCard education={latestEducation} />
            <ProfileWorkCard work={latestWork} />
            {(profile?.educations?.length ?? 0) > 1 || (profile?.workExperiences?.length ?? 0) > 1 ? (
              <MenuRow
                icon="list-outline"
                label="View full background"
                subtitle="See all education and work history"
                onPress={() => router.push('/profile/edit')}
              />
            ) : null}
          </View>
        ) : null}

        {/* Available on Personal, General, and Background tabs */}
        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [
            styles.logout,
            { borderColor: 'rgba(248, 113, 113, 0.35)', backgroundColor: colors.errorBg },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.logoutText, { color: colors.error }, fontStyle('bold')]}>Log out</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}
