import { Stack } from 'expo-router';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { GoogleAuthWrapper } from '@/components/google-auth-wrapper';
import { IncomingMessageSoundListener } from '@/components/incoming-message-sound-listener';
import { PersistentBottomPillNav } from '@/components/bottom-pill-tab-bar';
import { PersistentGlassTabHeader } from '@/components/glass-tab-header';
import { ConnectionSuccessHost } from '@/components/network/connection-success-host';
import { AuthProvider } from '@/lib/auth-context';
import { SavedJobsProvider } from '@/lib/saved-jobs-context';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useAppFonts } from '@/lib/use-app-fonts';

/**
 * KeyboardProvider has caused native Android release crashes when mounted at boot
 * with the New Architecture. Load it only after the first frame, and fall back if
 * the native module is unavailable.
 */
function OptionalKeyboardProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<null | ComponentType<{ children: ReactNode }>>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('react-native-keyboard-controller') as {
          KeyboardProvider?: ComponentType<{
            children: ReactNode;
            statusBarTranslucent?: boolean;
            navigationBarTranslucent?: boolean;
          }>;
        };
        if (!cancelled && mod.KeyboardProvider) {
          const KP = mod.KeyboardProvider;
          setProvider(() =>
            function WrappedKeyboardProvider({ children: inner }: { children: ReactNode }) {
              return (
                <KP statusBarTranslucent navigationBarTranslucent>
                  {inner}
                </KP>
              );
            },
          );
        }
      } catch {
        // App continues without keyboard-controller.
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
}

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
            fontFamily: theme.fonts.bold,
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
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="network/[userId]" options={{ title: 'Profile' }} />
        <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Job details' }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
        <Stack.Screen name="companies/[recruiterId]" options={{ title: 'Company' }} />
        <Stack.Screen name="saved-jobs" options={{ title: 'Saved jobs' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/security" options={{ title: 'Security' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="profile/network" options={{ title: 'My network' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
        <Stack.Screen name="fraud-alert" options={{ title: 'Fraud Alert' }} />
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

  // Hard fallback — never leave Play users on a blank spinner.
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background ?? '#F3F7FC',
          paddingHorizontal: 24,
        }}
      >
        <ActivityIndicator size="large" color={colors.blue ?? '#3F74CC'} />
        <Text style={{ marginTop: 14, color: colors.muted ?? '#5b6b82', fontSize: 14 }}>
          Starting MoonsJob…
        </Text>
      </View>
    );
  }

  return (
    <GoogleAuthWrapper>
      <AuthProvider>
        <SavedJobsProvider>
          <IncomingMessageSoundListener />
          <ConnectionSuccessHost />
          <View style={{ flex: 1 }}>
            <RootStack />
            <PersistentGlassTabHeader />
            <PersistentBottomPillNav />
          </View>
        </SavedJobsProvider>
      </AuthProvider>
    </GoogleAuthWrapper>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <ThemeProvider>
          <OptionalKeyboardProvider>
            <AppRoot />
          </OptionalKeyboardProvider>
        </ThemeProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
