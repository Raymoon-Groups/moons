'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@moons/shared';
import { CandidateDashboard } from '@/components/dashboard/candidate-dashboard';
import { RecruiterDashboard } from '@/components/dashboard/recruiter-dashboard';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (ready && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="p-8 text-center text-sm text-moons-muted">Checking session…</div>
    );
  }

  if (user.role === UserRole.RECRUITER) {
    return <RecruiterDashboard />;
  }

  return <CandidateDashboard />;
}
