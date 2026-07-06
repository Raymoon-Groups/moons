import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppIntro } from '@/components/app-intro';
import { AppSplash } from '@/components/app-splash';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { getIntroSeen, setIntroSeen } from '@/lib/app-preferences';

const SPLASH_MIN_MS = 1400;

export default function Index() {
  const { user, ready } = useAuth();
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [introSeen, setIntroSeenState] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    getIntroSeen().then((seen) => {
      setIntroSeenState(seen);
      setPrefsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const startedAt = Date.now();

    const id = setInterval(() => {
      const minElapsed = Date.now() - startedAt >= SPLASH_MIN_MS;
      if (ready && prefsLoaded && minElapsed) {
        setSplashDone(true);
        clearInterval(id);
      }
    }, 50);

    return () => clearInterval(id);
  }, [ready, prefsLoaded]);

  const finishIntro = useCallback(async () => {
    await setIntroSeen();
    setIntroSeenState(true);
    setShowIntro(false);
  }, []);

  useEffect(() => {
    if (!splashDone || !ready || !prefsLoaded) return;
    if (!introSeen && !user) {
      setShowIntro(true);
    }
  }, [splashDone, ready, prefsLoaded, introSeen, user]);

  if (!splashDone || !ready || !prefsLoaded) {
    return <AppSplash />;
  }

  if (showIntro) {
    return <AppIntro onComplete={() => void finishIntro()} />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={getPostAuthPath(user) as never} />;
}
