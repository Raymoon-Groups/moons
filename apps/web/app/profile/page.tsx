'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { CandidateProfileView } from '@/components/profile/candidate-profile-view';
import { RecruiterProfileView } from '@/components/profile/recruiter-profile-view';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, syncUserFromProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    const data = await authFetch<Profile>('/profiles/me');
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (!user) return;

    loadProfile()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router, ready, user, loadProfile]);

  function handleSaved(saved: Profile) {
    setProfile(saved);
    syncUserFromProfile(saved);
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-moons-muted">Loading profile…</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600">{error || 'Profile not found'}</p>
      </div>
    );
  }

  const isRecruiter = profile.role === UserRole.RECRUITER;

  if (isRecruiter) {
    return <RecruiterProfileView profile={profile} onSaved={handleSaved} />;
  }

  return <CandidateProfileView profile={profile} onSaved={handleSaved} />;
}
