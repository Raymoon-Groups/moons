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
    />
  );
}
