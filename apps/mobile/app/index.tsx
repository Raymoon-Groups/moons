import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIntro } from '@/components/app-intro';
import { MoonsLogo } from '@/components/moons-logo';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { getIntroSeen, setIntroSeen } from '@/lib/app-preferences';
import { displayFontStyle, fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

/**
 * Lightweight boot screen — avoids the heavy animated splash that could fail to
 * hand off on some Play Store devices.
 */
export default function Index() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [introSeen, setIntroSeenState] = useState(true);
  const [bootDone, setBootDone] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getIntroSeen()
      .then((seen) => {
        if (!cancelled) setIntroSeenState(seen);
      })
      .catch(() => {
        if (!cancelled) setIntroSeenState(true);
      })
      .finally(() => {
        if (!cancelled) setPrefsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Always leave the boot screen quickly once auth prefs are ready (or after 2.5s).
  useEffect(() => {
    if (ready && prefsLoaded) {
      const t = setTimeout(() => setBootDone(true), 400);
      return () => clearTimeout(t);
    }
    const hard = setTimeout(() => setBootDone(true), 2500);
    return () => clearTimeout(hard);
  }, [ready, prefsLoaded]);

  useEffect(() => {
    if (!bootDone || !ready || !prefsLoaded) return;
    if (!introSeen && !user) setShowIntro(true);
  }, [bootDone, ready, prefsLoaded, introSeen, user]);

  const finishIntro = useCallback(async (dest?: 'login' | 'register') => {
    try {
      await setIntroSeen();
    } catch {
      // ignore
    }
    setIntroSeenState(true);
    setShowIntro(false);
    if (dest === 'register') {
      router.replace('/register');
      return;
    }
    if (dest === 'login') {
      router.replace('/login');
    }
  }, []);

  if (!bootDone) {
    return (
      <View
        style={[
          styles.boot,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <MoonsLogo size="xl" />
        <Text style={[styles.title, { color: colors.heading }]}>MoonsJob</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Jobs, network, and hiring — in one place.
        </Text>
        {!ready || !prefsLoaded ? (
          <ActivityIndicator style={{ marginTop: 28 }} color={colors.blue} />
        ) : (
          <Pressable
            style={[styles.cta, { backgroundColor: colors.blue }]}
            onPress={() => setBootDone(true)}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (showIntro) {
    return <AppIntro onComplete={(dest) => void finishIntro(dest)} />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={getPostAuthPath(user) as never} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    marginTop: 18,
    fontSize: 28,
    ...displayFontStyle('bold'),
  },
  sub: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    ...fontStyle('regular'),
  },
  cta: {
    marginTop: 28,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    ...fontStyle('semibold'),
  },
});
