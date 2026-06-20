import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CandidateProfileEdit } from '@/components/profile/candidate-profile-edit';
import { RecruiterProfileEdit } from '@/components/profile/recruiter-profile-edit';
import { LoadingScreen } from '@/components/loading-screen';
import { ErrorText, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { mergeProfileIntoUser } from '@/lib/profile-sync';
import type { Profile } from '@/lib/types';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch<Profile>('/profiles/me')
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaved(saved: Profile) {
    setProfile(saved);
    if (user) {
      await updateUser(mergeProfileIntoUser(user, saved));
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !profile) {
    return (
      <Screen>
        <ErrorText>{error || 'Profile not found'}</ErrorText>
      </Screen>
    );
  }

  if (isRecruiter) {
    return <RecruiterProfileEdit profile={profile} onSaved={handleSaved} />;
  }

  return <CandidateProfileEdit profile={profile} onSaved={handleSaved} />;
}
