import { Redirect } from 'expo-router';
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
    getIntroSeen().then((seen) => {
      setIntroSeenState(seen);
      setPrefsLoaded(true);
    });
  }, []);

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

  if (!splashDone) {
    return (
      <AppSplash
        continueReady={ready && prefsLoaded}
        onGetStarted={() => setSplashDone(true)}
      />
    );
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
