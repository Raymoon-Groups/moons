import { Stack } from 'expo-router';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { PersistentBottomPillNav } from '@/components/bottom-pill-tab-bar';
import { PersistentGlassTabHeader } from '@/components/glass-tab-header';
import { GoogleAuthWrapper } from '@/components/google-auth-wrapper';
import { AuthProvider } from '@/lib/auth-context';
import { showNavChrome, resetNavChrome } from '@/lib/nav-chrome';
import { SavedJobsProvider } from '@/lib/saved-jobs-context';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useAppFonts } from '@/lib/use-app-fonts';

/**
 * Mount non-critical UI only after the first interactive frame so cold start
 * cannot die on optional native-heavy modules (audio, etc.).
 */
function DeferredMount({ children, delayMs = 0 }: { children: ReactNode; delayMs?: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handle = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => setReady(true), delayMs);
    });
    // Hard fallback — never leave optional chrome permanently unmounted.
    const fallback = setTimeout(() => setReady(true), Math.max(delayMs, 0) + 1500);
    return () => {
      handle.cancel();
      if (timer) clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, [delayMs]);

  if (!ready) return null;
  return <>{children}</>;
}

function AppChrome() {
  useEffect(() => {
    resetNavChrome();
    showNavChrome();
  }, []);

  return (
    <>
      <PersistentGlassTabHeader />
      <PersistentBottomPillNav />
    </>
  );
}

function LazyIncomingMessageSoundListener() {
  const [Cmp, setCmp] = useState<null | ComponentType>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@/components/incoming-message-sound-listener')
      .then((mod) => {
        if (!cancelled) setCmp(() => mod.IncomingMessageSoundListener);
      })
      .catch(() => {
        // Optional — app works without message sounds.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return Cmp ? <Cmp /> : null;
}

function LazyConnectionSuccessHost() {
  const [Cmp, setCmp] = useState<null | ComponentType>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@/components/network/connection-success-host')
      .then((mod) => {
        if (!cancelled) setCmp(() => mod.ConnectionSuccessHost);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return Cmp ? <Cmp /> : null;
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

  useEffect(() => {
    if (fontsLoaded) setMounted(true);
  }, [fontsLoaded]);

  // Hard fallback — never leave Play users on a blank screen.
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // Match splash background — no spinner flash while fonts resolve (often <1 frame).
    return <View style={[styles.flex, { backgroundColor: '#F3F7FC' }]} />;
  }

  return (
    <GoogleAuthWrapper>
      <AuthProvider>
        <SavedJobsProvider>
          <View style={styles.flex}>
            <RootStack />
            <AppChrome />
          </View>
          <DeferredMount delayMs={400}>
            <LazyIncomingMessageSoundListener />
            <LazyConnectionSuccessHost />
          </DeferredMount>
        </SavedJobsProvider>
      </AuthProvider>
    </GoogleAuthWrapper>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <ThemeProvider>
            <AppRoot />
          </ThemeProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
