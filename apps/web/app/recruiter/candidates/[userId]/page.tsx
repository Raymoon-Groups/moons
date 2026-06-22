'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import {
  DashBackLink,
  DashErrorCard,
  DashLoadingPage,
  DashPageHero,
  DashPageLayout,
  DashQuickLinks,
  DashSidebarPanel,
  DashTipsList,
} from '@/components/dash/dash-page-shell';
import { CandidateProfileReadonly } from '@/components/profile/candidate-profile-readonly';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import { formatExperience, getResumeDisplayName } from '@/components/profile/profile-shared';
import type { Profile } from '@/lib/types';

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
      />
    </svg>
  );
}

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

  if (loading) return <DashLoadingPage message="Loading candidate…" />;

  if (error || !profile) {
    return (
      <DashErrorCard message={error || 'Profile not found'} backHref="/recruiter/jobs" backLabel="← Back to my jobs" />
    );
  }

  const displayName = profile.fullName?.trim() || profile.email.split('@')[0];
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = getResumeDisplayName(profile);

  return (
    <DashPageLayout
      backLink={
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated px-3 py-1.5 text-sm font-medium text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-surface-hover"
        >
          ← Back
        </button>
      }
      sidebar={
        <>
          <DashSidebarPanel title="At a glance">
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Profile completion', value: `${profile.completionPercent}%` },
                profile.experienceYears != null
                  ? { label: 'Experience', value: formatExperience(profile.experienceYears) }
                  : null,
                profile.location ? { label: 'Location', value: profile.location } : null,
                profile.noticePeriod ? { label: 'Notice period', value: profile.noticePeriod } : null,
                profile.skills.length > 0
                  ? { label: 'Skills listed', value: String(profile.skills.length) }
                  : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div
                    key={row!.label}
                    className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2"
                  >
                    <dt className="text-moons-muted">{row!.label}</dt>
                    <dd className="text-right font-semibold text-heading">{row!.value}</dd>
                  </div>
                ))}
            </dl>
          </DashSidebarPanel>

          <DashSidebarPanel title="Compensation">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                <dt className="text-moons-muted">Current CTC</dt>
                <dd className="text-right font-semibold text-heading">{profile.currentCtc || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                <dt className="text-moons-muted">Expected CTC</dt>
                <dd className="text-right font-semibold text-heading">{profile.expectedCtc || '—'}</dd>
              </div>
            </dl>
          </DashSidebarPanel>

          <DashSidebarPanel title="Actions">
            <div className="flex flex-col gap-2">
              {resumeUrl && resumeFileName && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md"
                >
                  <span className="truncate">{resumeFileName}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
              >
                Back to applicants
              </button>
              <Link
                href="/recruiter/jobs"
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue/40 hover:text-heading"
              >
                All posted jobs
              </Link>
            </div>
          </DashSidebarPanel>

          <DashTipsList
            title="Review tips"
            items={[
              `Compare ${displayName}'s experience and skills against your job requirements.`,
              'Check notice period and expected CTC before scheduling interviews.',
              'Update application status from the applicants page after your review.',
            ]}
          />
        </>
      }
    >
      <DashPageHero
        eyebrow="Candidate profile"
        eyebrowIcon={<UserIcon className="h-3.5 w-3.5" />}
        title={displayName}
        subtitle={profile.headline || profile.email}
      />

      <div className="recruiter-job-card overflow-hidden p-0">
        <div className="h-1 bg-gradient-to-r from-moons-blue via-moons-blue/70 to-transparent" />
        <div className="p-2 md:p-4">
          <CandidateProfileReadonly profile={profile} />
        </div>
      </div>
    </DashPageLayout>
  );
}
