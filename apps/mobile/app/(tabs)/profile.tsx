import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { MenuRow } from '@/components/menu-row';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { DisplayStatusToggle } from '@/components/profile/display-status-toggle';
import { EditableProfilePhoto } from '@/components/profile/editable-profile-photo';
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
import { MoonsPlusPromoCard } from '@/components/feed/moons-plus-promo';
import { ProfileRing } from '@/components/profile-ring';
import { PrimaryBanner, SectionTitle } from '@/components/portal-ui';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
import { useProfile } from '@/lib/use-profile';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function ProfileInfoCard({
  label,
  children,
  isDark,
  surface,
  muted,
  heading,
}: {
  label: string;
  children: ReactNode;
  isDark: boolean;
  surface: string;
  muted: string;
  heading: string;
}) {
  return (
    <View
      style={[
        {
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          backgroundColor: isDark ? surface : '#fff',
          ...theme.shadow.soft,
        },
      ]}
    >
      <Text
        style={[
          {
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 6,
            color: muted,
          },
          fontStyle('semibold'),
        ]}
      >
        {label}
      </Text>
      {typeof children === 'string' ? (
        <Text style={[{ fontSize: 15, lineHeight: 22, color: heading }, fontStyle('medium')]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

function ProfileDetailRow({
  label,
  value,
  muted,
  heading,
}: {
  label: string;
  value?: string | null;
  muted: string;
  heading: string;
}) {
  if (!value?.trim()) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[{ fontSize: 11, color: muted, marginBottom: 3 }, fontStyle('semibold')]}>
        {label}
      </Text>
      <Text style={[{ fontSize: 14, lineHeight: 20, color: heading }, fontStyle('medium')]}>
        {value}
      </Text>
    </View>
  );
}

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
  const topPadding = useTabScreenTopPadding();
  const navScroll = useNavChromeScrollProps();
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
  const companyName = profile?.currentCompany?.trim() || name;
  const headline =
    profile?.headline?.trim() ||
    profile?.designation?.trim() ||
    (isRecruiter ? industryLine : null);

  const latestEducation = profile?.educations?.[0] ?? null;
  const latestWork = profile?.workExperiences?.[0] ?? null;
  const hasCompanyDetails = Boolean(
    profile?.currentCompany?.trim() ||
      profile?.companyWebsite?.trim() ||
      profile?.industry?.trim() ||
      profile?.companySize?.trim() ||
      profile?.companyType?.trim(),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: theme.spacing.md,
          paddingBottom: bottomPadding,
          paddingTop: topPadding,
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
          paddingTop: 0,
          paddingHorizontal: 0,
          paddingBottom: 0,
          marginBottom: theme.spacing.lg,
          width: '100%',
          overflow: 'hidden',
          backgroundColor: isDark ? undefined : '#fff',
        },
        heroBody: {
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: 0,
          paddingBottom: theme.spacing.md,
          width: '100%',
          marginTop: -44,
          zIndex: 1,
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
    [bottomPadding, topPadding, isDark],
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
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          {...navScroll}
        >
          <View style={[styles.hero, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceElevated : '#fff' }]}>
            <CoverPhotoBanner
              bannerUrl={profile?.bannerUrl ?? null}
              updatedAt={profile?.updatedAt}
              editable
              onUpdated={() => {
                void refresh();
              }}
            />
            <View style={styles.heroBody}>
              <EditableProfilePhoto
                uri={logoUrl || avatarUrl}
                name={companyName}
                kind={logoUrl ? 'logo' : 'avatar'}
                editable
                onUpdated={() => {
                  void refresh();
                }}
                style={{
                  borderRadius: 999,
                  backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                  padding: 4,
                }}
              >
                <ProfileRing
                  percent={profile?.completionPercent ?? (user.onboardingCompleted ? 72 : 30)}
                  name={companyName}
                  avatarUrl={avatarUrl}
                  logoUrl={logoUrl}
                />
              </EditableProfilePhoto>
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
          </View>

          {(profile?.completionPercent ?? 0) < 100 ? (
            <PrimaryBanner
              title="Strengthen your company profile"
              subtitle={`You're at ${profile?.completionPercent ?? 0}% — complete your profile to stand out.`}
              ctaLabel="Edit profile"
              onPress={() => router.push('/profile/edit')}
            />
          ) : null}

          <SectionTitle>Profile</SectionTitle>
          <ProfileInfoCard
            label="Personal"
            isDark={isDark}
            surface={colors.surfaceElevated}
            muted={colors.muted}
            heading={colors.heading}
          >
            <ProfileDetailRow
              label="Full name"
              value={name}
              muted={colors.muted}
              heading={colors.heading}
            />
            <ProfileDetailRow
              label="Email"
              value={user.email}
              muted={colors.muted}
              heading={colors.heading}
            />
            <ProfileDetailRow
              label="Phone"
              value={profile?.phone}
              muted={colors.muted}
              heading={colors.heading}
            />
            <ProfileDetailRow
              label="Designation"
              value={profile?.designation}
              muted={colors.muted}
              heading={colors.heading}
            />
            <ProfileDetailRow
              label="Office city"
              value={profile?.location}
              muted={colors.muted}
              heading={colors.heading}
            />
            <ProfileDetailRow
              label="Office address"
              value={profile?.officeAddress}
              muted={colors.muted}
              heading={colors.heading}
            />
          </ProfileInfoCard>

          <ProfileInfoCard
            label="Company"
            isDark={isDark}
            surface={colors.surfaceElevated}
            muted={colors.muted}
            heading={colors.heading}
          >
            {hasCompanyDetails ? (
              <>
                <ProfileDetailRow
                  label="Company name"
                  value={profile?.currentCompany}
                  muted={colors.muted}
                  heading={colors.heading}
                />
                <ProfileDetailRow
                  label="Website"
                  value={profile?.companyWebsite}
                  muted={colors.muted}
                  heading={colors.heading}
                />
                <ProfileDetailRow
                  label="Industry"
                  value={profile?.industry}
                  muted={colors.muted}
                  heading={colors.heading}
                />
                <ProfileDetailRow
                  label="Company size"
                  value={profile?.companySize}
                  muted={colors.muted}
                  heading={colors.heading}
                />
                <ProfileDetailRow
                  label="Company type"
                  value={profile?.companyType}
                  muted={colors.muted}
                  heading={colors.heading}
                />
              </>
            ) : (
              <Text style={[{ fontSize: 14, lineHeight: 20, color: colors.muted }, fontStyle('regular')]}>
                Add company details from Edit profile.
              </Text>
            )}
          </ProfileInfoCard>

          {profile?.summary?.trim() ? (
            <ProfileInfoCard
              label="About company"
              isDark={isDark}
              surface={colors.surfaceElevated}
              muted={colors.muted}
              heading={colors.heading}
            >
              {profile.summary.trim()}
            </ProfileInfoCard>
          ) : null}

          <MenuRow
            icon="create-outline"
            label="Edit profile"
            subtitle="Update personal and company details"
            onPress={() => router.push('/profile/edit')}
          />

          <SectionTitle>Account</SectionTitle>
          <MenuRow
            icon="people"
            label="My network"
            subtitle="Connections, pending & visitors"
            onPress={() => router.push('/profile/network')}
          />
          <MenuRow
            icon="business-outline"
            label="Browse companies"
            subtitle="Explore employers and open roles"
            onPress={() => router.push('/(tabs)/companies')}
          />
          <MenuRow
            icon="settings"
            label="Settings"
            subtitle="Edit profile, security, appearance & legal"
            onPress={() => router.push('/settings')}
          />
          <MenuRow
            icon="people"
            label="Browse candidates"
            subtitle="Search talent pool"
            onPress={() => router.push('/recruiter/candidates')}
          />

          <MoonsPlusPromoCard compact />

          <ProfilePostsSection
            userId={user.id}
            emptyMessage="You have not posted anything yet. Share an update from your feed."
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
        {...navScroll}
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
          onAvatarUpdated={() => {
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

            <MoonsPlusPromoCard compact />

            <ProfilePostsSection
              userId={user.id}
              emptyMessage="You have not posted anything yet. Share an update from your feed."
            />
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
