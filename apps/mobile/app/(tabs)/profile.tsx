import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { MenuRow } from '@/components/menu-row';
import { ProfileRing } from '@/components/profile-ring';
import { PrimaryBanner, SectionTitle } from '@/components/portal-ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useProfile } from '@/lib/use-profile';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { profile, name, avatarUrl } = useProfile();

  const heroColors = isDark
    ? (['rgba(74, 127, 212, 0.18)', 'rgba(26, 39, 68, 0.5)'] as const)
    : (['rgba(74, 127, 212, 0.12)', 'rgba(238, 242, 247, 0.98)'] as const);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (!user) return null;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={heroColors} style={[styles.hero, { borderColor: colors.border }]}>
          <ProfileRing
            percent={profile?.completionPercent ?? (user.onboardingCompleted ? 72 : 30)}
            name={name}
            avatarUrl={avatarUrl}
          />
          <Text style={[styles.name, { color: colors.heading }, fontStyle('extrabold')]}>{name}</Text>
          <Text style={[styles.email, { color: colors.muted }, fontStyle('regular')]}>{user.email}</Text>
          <View style={[styles.rolePill, { borderColor: `${colors.blue}44` }]}>
            <Text style={[styles.roleText, { color: colors.blue }, fontStyle('bold')]}>
              {user.role === UserRole.RECRUITER ? 'Employer account' : 'Jobseeker account'}
            </Text>
          </View>
        </LinearGradient>

        {(profile?.completionPercent ?? 0) < 100 ? (
          <PrimaryBanner
            title="Strengthen your profile"
            subtitle={`You're at ${profile?.completionPercent ?? 0}% — complete your profile to stand out.`}
            ctaLabel="Edit profile"
            onPress={() => router.push('/profile/edit')}
          />
        ) : null}

        <SectionTitle>Preferences</SectionTitle>
        <View style={[styles.themeRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.themeLabel, { color: colors.heading }, fontStyle('bold')]}>Appearance</Text>
            <Text style={[styles.themeHint, { color: colors.muted }, fontStyle('regular')]}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <SectionTitle>Account</SectionTitle>
        <MenuRow
          icon="settings"
          label="Settings"
          subtitle="Edit profile, security & account"
          onPress={() => router.push('/settings')}
        />

        {user.role === UserRole.RECRUITER ? (
          <MenuRow icon="people" label="Browse candidates" subtitle="Search talent pool" onPress={() => router.push('/recruiter/candidates')} />
        ) : null}

        <Pressable
          onPress={handleLogout}
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

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md, paddingBottom: 32 },
  hero: {
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  name: { marginTop: 12, fontSize: 22 },
  email: { marginTop: 4, fontSize: 14 },
  rolePill: {
    marginTop: 12,
    backgroundColor: 'rgba(107, 154, 232, 0.15)',
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  roleText: { fontSize: 12 },
  section: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  themeLabel: { fontSize: 15 },
  themeHint: { marginTop: 2, fontSize: 12 },
  logout: {
    marginTop: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15 },
});
