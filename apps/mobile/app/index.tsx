import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppIntro } from '@/components/app-intro';
import { AppSplash } from '@/components/app-splash';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { getIntroSeen, setIntroSeen } from '@/lib/app-preferences';

export default function Index() {
  const { user, ready } = useAuth();
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [introSeen, setIntroSeenState] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getIntroSeen()
      .then((seen) => {
        if (!cancelled) setIntroSeenState(seen);
      })
      .catch(() => {
        // SecureStore can fail on some devices — don't block app open.
        if (!cancelled) setIntroSeenState(true);
      })
      .finally(() => {
        if (!cancelled) setPrefsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const finishIntro = useCallback(async (dest?: 'login' | 'register') => {
    try {
      await setIntroSeen();
    } catch {
      // ignore persistence errors
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

  const onGetStarted = useCallback(() => {
    setSplashDone(true);
  }, []);

  useEffect(() => {
    if (!splashDone || !ready || !prefsLoaded) return;
    if (!introSeen && !user) {
      setShowIntro(true);
    }
  }, [splashDone, ready, prefsLoaded, introSeen, user]);

  if (!splashDone) {
    return (
      <AppSplash continueReady={ready && prefsLoaded} onGetStarted={onGetStarted} />
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
