import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function RecruiterLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceElevated },
        headerTintColor: colors.heading,
        headerTitleStyle: { fontFamily: theme.fonts.bold, color: colors.heading },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="jobs/new" options={{ title: 'Post a job' }} />
      <Stack.Screen name="jobs/[id]/index" options={{ title: 'Job details' }} />
      <Stack.Screen name="jobs/[id]/edit" options={{ title: 'Edit job' }} />
      <Stack.Screen name="jobs/[id]/applicants" options={{ title: 'Applicants' }} />
      <Stack.Screen name="candidates/index" options={{ title: 'Candidates' }} />
      <Stack.Screen name="candidates/[userId]" options={{ title: 'Candidate' }} />
    </Stack>
  );
}
