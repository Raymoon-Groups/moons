import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';

export default function Index() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={getPostAuthPath(user) as never} />;
}
