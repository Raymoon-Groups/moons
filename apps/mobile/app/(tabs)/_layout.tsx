import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function HeaderActions() {
  const { indicators } = useNavIndicators();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const iconSize = compact ? 18 : 20;
  const btnSize = compact ? 36 : 40;

  return (
    <View style={[styles.headerRight, compact && styles.headerRightCompact]}>
      <Pressable
        onPress={() => router.push('/search')}
        style={[
          styles.profileBtn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
        accessibilityLabel="Search"
      >
        <Ionicons name="search" size={iconSize} color={colors.heading} />
      </Pressable>
      <NotificationBell hasUnread={indicators.bell} compact={compact} />
      <ThemeToggle size={compact ? 36 : 40} />
      <Pressable
        onPress={() => router.push('/(tabs)/profile')}
        style={[
          styles.profileBtn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
        accessibilityLabel="Profile"
      >
        <Ionicons name="person-outline" size={iconSize} color={colors.heading} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const isRecruiter = user?.role === UserRole.RECRUITER;

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (!user.onboardingCompleted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surfaceElevated,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.heading,
        headerTitleStyle: { fontFamily: theme.fonts.semibold, fontSize: 17, color: colors.heading },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          headerTitle: 'Feed',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          headerTitle: 'Jobs',
          href: isRecruiter ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applied',
          headerTitle: 'Applications',
          href: null,
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'Jobs',
          headerTitle: 'My jobs',
          href: isRecruiter ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          headerTitle: 'My Network',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerTitle: 'Messaging',
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
          headerTitle: 'Companies',
          href: isRecruiter ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="candidates"
        options={{
          title: 'Candidates',
          headerTitle: 'Candidates',
          href: isRecruiter ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
    flexShrink: 1,
  },
  headerRightCompact: {
    gap: 6,
    marginRight: 8,
  },
  profileBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
