import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { GlassTabHeader } from '@/components/glass-tab-header';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

function resolveHeaderTitle(options: { headerTitle?: unknown; title?: string }) {
  if (typeof options.headerTitle === 'string') return options.headerTitle;
  if (typeof options.title === 'string') return options.title;
  return '';
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
        header: ({ options }) => <GlassTabHeader title={resolveHeaderTitle(options)} />,
        headerShadowVisible: false,
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
