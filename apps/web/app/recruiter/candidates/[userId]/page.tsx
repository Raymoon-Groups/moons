'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CandidateProfileReadonly } from '@/components/profile/candidate-profile-readonly';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import { getResumeDisplayName } from '@/components/profile/profile-shared';
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
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f0f3f8] text-sm text-moons-muted">
        Loading candidate…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[50vh] bg-[#f0f3f8] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{error || 'Profile not found'}</p>
          <Link
            href="/recruiter/jobs"
            className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline"
          >
            ← Back to my jobs
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.fullName?.trim() || profile.email.split('@')[0];
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = getResumeDisplayName(profile);

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← Back
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0">
            <CandidateProfileReadonly profile={profile} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">At a glance</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Profile completion</dt>
                  <dd className="font-semibold text-moons-navy">{profile.completionPercent}%</dd>
                </div>
                {profile.experienceYears != null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-moons-muted">Experience</dt>
                    <dd className="text-right font-semibold text-moons-navy">
                      {formatExperience(profile.experienceYears)}
                    </dd>
                  </div>
                )}
                {profile.location && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-moons-muted">Location</dt>
                    <dd className="text-right font-semibold text-moons-navy">{profile.location}</dd>
                  </div>
                )}
                {profile.noticePeriod && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-moons-muted">Notice period</dt>
                    <dd className="text-right font-semibold text-moons-navy">
                      {profile.noticePeriod}
                    </dd>
                  </div>
                )}
                {profile.skills.length > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-moons-muted">Skills listed</dt>
                    <dd className="font-semibold text-moons-navy">{profile.skills.length}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Compensation</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Current CTC</dt>
                  <dd className="text-right font-semibold text-moons-navy">
                    {profile.currentCtc || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Expected CTC</dt>
                  <dd className="text-right font-semibold text-moons-navy">
                    {profile.expectedCtc || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {resumeUrl && resumeFileName && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                  >
                    <span className="truncate">{resumeFileName}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  Back to applicants
                </button>
                <Link
                  href="/recruiter/jobs"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-moons-navy"
                >
                  All posted jobs
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Review tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>
                  Compare {displayName}&apos;s experience and skills against your job requirements.
                </li>
                <li>Check notice period and expected CTC before scheduling interviews.</li>
                <li>Update application status from the applicants page after your review.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
