import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleAuthWrapper } from '@/components/google-auth-wrapper';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useAppFonts } from '@/lib/use-app-fonts';

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceElevated },
          headerTintColor: colors.heading,
          headerTitleStyle: {
            fontFamily: Platform.OS === 'web' ? theme.fonts.web.bold : theme.fonts.bold,
            fontWeight: '700',
            color: colors.heading,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Job details' }} />
        <Stack.Screen name="companies/[recruiterId]" options={{ title: 'Company' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/security" options={{ title: 'Security' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="recruiter" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function AppRoot() {
  const fontsLoaded = useAppFonts();
  const [mounted, setMounted] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (fontsLoaded) setMounted(true);
  }, [fontsLoaded]);

  if (!mounted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <GoogleAuthWrapper>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </GoogleAuthWrapper>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
