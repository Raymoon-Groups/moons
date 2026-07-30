import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { MenuRow } from '@/components/menu-row';
import { OpenOnMoonsToggle } from '@/components/profile/open-on-moons-toggle';
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

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { profile, name, avatarUrl, logoUrl, refresh } = useProfile();
  const bottomPadding = useTabScreenPadding();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const companyName = profile?.currentCompany?.trim() || name;
  const industryLine = profile?.industry?.trim() || '';
  const locationLine = profile?.location?.trim() || '';
  const metaLine = [industryLine, locationLine].filter(Boolean).join(' · ');

  const heroColors = isDark
    ? (['rgba(74, 127, 212, 0.18)', 'rgba(26, 39, 68, 0.5)'] as const)
    : (['rgba(74, 127, 212, 0.12)', 'rgba(238, 242, 247, 0.98)'] as const);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: theme.spacing.md,
          paddingBottom: bottomPadding,
        },
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
        email: {
          marginTop: 4,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
          maxWidth: '100%',
        },
        meta: {
          marginTop: 4,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
        },
        rolePill: {
          marginTop: 12,
          backgroundColor: 'rgba(107, 154, 232, 0.15)',
          borderRadius: theme.radius.full,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderWidth: 1,
          maxWidth: '100%',
        },
        roleText: { fontSize: 12, textAlign: 'center' },
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
        themeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          padding: 14,
          marginBottom: 16,
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
      }),
    [bottomPadding],
  );

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (!user) return null;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={heroColors} style={[styles.hero, { borderColor: colors.border }]}>
          <View style={styles.heroBody}>
            <ProfileRing
              percent={profile?.completionPercent ?? (user.onboardingCompleted ? 72 : 30)}
              name={isRecruiter ? companyName : name}
              avatarUrl={avatarUrl}
              logoUrl={isRecruiter ? logoUrl : null}
            />
            <Text
              numberOfLines={2}
              style={[styles.name, { color: colors.heading }, fontStyle('extrabold')]}
            >
              {isRecruiter ? companyName : name}
            </Text>
            {isRecruiter && metaLine ? (
              <Text numberOfLines={2} style={[styles.meta, { color: colors.muted }, fontStyle('regular')]}>
                {metaLine}
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={[styles.email, { color: colors.muted }, fontStyle('regular')]}
              >
                {user.email}
              </Text>
            )}
            {!isRecruiter ? (
              <View style={[styles.rolePill, { borderColor: `${colors.blue}44` }]}>
                <Text
                  numberOfLines={1}
                  style={[styles.roleText, { color: colors.blue }, fontStyle('bold')]}
                >
                  Jobseeker account
                </Text>
              </View>
            ) : null}
          </View>

          {isRecruiter ? (
            <View
              style={[
                styles.recruiterStrip,
                {
                  borderTopColor: `${colors.blue}26`,
                  backgroundColor: `${colors.blue}14`,
                },
              ]}
            >
              <View style={[styles.recruiterAvatar, { backgroundColor: colors.blue }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.recruiterAvatarImg} contentFit="cover" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 11, ...fontStyle('bold') }}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.recruiterCopy}>
                <Text style={[styles.recruiterLabel, { color: colors.blue }, fontStyle('semibold')]}>
                  Recruiter
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.recruiterName, { color: colors.heading }, fontStyle('bold')]}
                >
                  {name}
                </Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        {(profile?.completionPercent ?? 0) < 100 ? (
          <PrimaryBanner
            title="Strengthen your profile"
            subtitle={`You're at ${profile?.completionPercent ?? 0}% — complete your profile to stand out.`}
            ctaLabel="Edit profile"
            onPress={() => router.push('/profile/edit')}
          />
        ) : null}

        {user.role === UserRole.CANDIDATE && profile ? (
          <OpenOnMoonsToggle profile={profile} onUpdated={() => void refresh()} />
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

        {user.role === UserRole.RECRUITER ? (
          <MenuRow
            icon="people"
            label="Browse candidates"
            subtitle="Search talent pool"
            onPress={() => router.push('/recruiter/candidates')}
          />
        ) : (
          <MenuRow
            icon="document-text"
            label="My applications"
            subtitle="Track your job applications"
            onPress={() => router.push('/(tabs)/applications')}
          />
        )}

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
