import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

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
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          href: isRecruiter ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applied',
          href: isRecruiter ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'Jobs',
          href: isRecruiter ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
        }}
      />
      <Tabs.Screen
        name="candidates"
        options={{
          title: 'Candidates',
          href: isRecruiter ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null,
        }}
      />
    </Tabs>
  );
}
