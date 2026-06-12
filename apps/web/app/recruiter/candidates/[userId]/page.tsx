'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CandidateProfileReadonly } from '@/components/profile/candidate-profile-readonly';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { Profile } from '@/lib/types';

export default function RecruiterCandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.RECRUITER) {
      router.replace('/dashboard');
      return;
    }

    authFetch<Profile>(`/profiles/candidates/${userId}`)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId, router]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-moons-muted">Loading candidate…</div>;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">{error || 'Profile not found'}</p>
        <Link href="/recruiter/jobs" className="mt-4 inline-block text-sm text-moons-blue hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface-elevated">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-moons-blue hover:underline"
          >
            ← Back
          </button>
          <h1 className="mt-1 text-xl font-bold text-moons-navy">Candidate profile</h1>
          <p className="text-sm text-moons-muted">Full application profile for hiring review</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <CandidateProfileReadonly profile={profile} />
      </div>
    </div>
  );
}
