import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppIntro } from '@/components/app-intro';
import { AppSplash } from '@/components/app-splash';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { getIntroSeen, setIntroSeen } from '@/lib/app-preferences';

type StartPhase = 'splash' | 'intro' | 'gate';

/**
 * Start flow:
 * splash (swipe) → intro (first time) → login/feed
 * Logged-in users go straight to destination via replace (no Redirect blank frame).
 */
export default function Index() {
  const { user, ready } = useAuth();
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [introSeen, setIntroSeenState] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<StartPhase>('splash');

  useEffect(() => {
    let cancelled = false;
    getIntroSeen()
      .then((seen) => {
        if (!cancelled) setIntroSeenState(seen);
      })
      .catch(() => {
        if (!cancelled) setIntroSeenState(false);
      })
      .finally(() => {
        if (!cancelled) setPrefsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goPostAuth = useCallback(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }
    router.replace(getPostAuthPath(user) as never);
  }, [user]);

  const finishIntro = useCallback(
    async (dest?: 'login' | 'register') => {
      try {
        await setIntroSeen();
      } catch {
        // ignore
      }
      setIntroSeenState(true);
      if (dest === 'register') {
        router.replace('/register');
        return;
      }
      if (dest === 'login') {
        router.replace('/login');
        return;
      }
      goPostAuth();
    },
    [goPostAuth],
  );

  const onSplashDone = useCallback(() => {
    if (!user && introSeen === false) {
      setPhase('intro');
      return;
    }
    goPostAuth();
  }, [goPostAuth, introSeen, user]);

  const continueReady = ready && prefsLoaded && introSeen !== null;

  if (phase === 'splash') {
    return <AppSplash continueReady={continueReady} onGetStarted={onSplashDone} />;
  }

  if (phase === 'intro' && !user) {
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
