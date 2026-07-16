'use client';

import { RichTextContent } from '@/components/rich-text-content';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CompanyProfileCard } from '@/components/company-profile-card';
import { JobCompanyHeader, PostedByLine } from '@/components/job-company-header';
import { ApplyJobModal } from '@/components/jobs/apply-job-modal';
import { JobKeyDetailsList } from '@/components/jobs/job-key-details';
import { JobTags } from '@/components/jobs/job-tags';
import { apiFetch, authFetch } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth';
import { formatPostedAgo } from '@/lib/job-formatters';
import type { JobListing } from '@/lib/jobs';

export function JobDetailPanel({
  jobId,
  initialJob,
}: {
  jobId: string | null;
  initialJob?: JobListing | null;
}) {
  const [job, setJob] = useState<JobListing | null>(
    initialJob && initialJob.id === jobId ? initialJob : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  const user = getStoredUser();
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;

    const hasPreview = initialJob?.id === jobId;
    if (hasPreview) {
      setJob(initialJob);
      setLoading(false);
      setError('');
    }

    async function load() {
      if (!hasPreview) {
        setLoading(true);
        setError('');
      }
      setApplied(false);
      setApplyOpen(false);

      try {
        const data = hasPreview ? initialJob! : await apiFetch<JobListing>(`/jobs/${jobId}`);
        if (cancelled) return;
        if (!hasPreview) setJob(data);

        if (getStoredUser()?.role === UserRole.CANDIDATE && getAccessToken()) {
          const check = await authFetch<{ applied: boolean }>(
            `/applications/check?jobId=${jobId}`,
          );
          if (!cancelled) setApplied(check.applied);
        }
      } catch (err) {
        if (!cancelled && !hasPreview) {
          setError(err instanceof Error ? err.message : 'Job not found');
          setJob(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId, initialJob]);

  if (!jobId) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-center text-sm text-moons-muted lg:min-h-[420px] lg:p-8">
        Select a job from the list to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-sm text-moons-muted lg:min-h-[420px] lg:p-8">
        Loading job…
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600">{error || 'Job not found'}</p>
      </div>
    );
  }

  function detailIcon(label: string) {
    switch (label) {
      case 'Location':
        return <PinIcon />;
      case 'Employment type':
        return <BriefcaseIcon />;
      case 'Experience required':
        return <ExperienceIcon />;
      case 'Salary':
        return <DollarIcon />;
      case 'Work mode':
        return <ListIcon />;
      default:
        return <ListIcon />;
    }
  }

  const questionCount = job.screeningQuestions?.length ?? 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border px-6 py-5">
        <div>
          <h1 className="text-xl font-bold text-heading md:text-2xl">{job.title}</h1>
          <p className="mt-1 text-sm text-moons-muted">
            {job.companyName}
            {job.location ? ` · ${job.location}` : ''}
            {' · '}
            {formatPostedAgo(job.createdAt)}
          </p>
          <PostedByLine job={job} className="mt-1.5" />
        </div>

        <div className="mt-4">
          <JobKeyDetailsList job={job} iconForLabel={detailIcon} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
            >
              Login to apply
              <ExternalIcon />
            </Link>
          )}

          {isLoggedIn && !isCandidate && (
            <p className="text-sm text-moons-muted">Log in as a jobseeker to apply for this role.</p>
          )}

          {isCandidate && applied && (
            <div className="w-full">
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-300">
                ✓ You have applied to this job
              </p>
              <Link href="/applications" className="mt-2 inline-block text-sm text-moons-blue hover:underline">
                View my applications →
              </Link>
            </div>
          )}

          {isCandidate && !applied && job.status === 'CLOSED' && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This position is closed and no longer accepting applications.
            </p>
          )}

          {isCandidate && !applied && job.status !== 'CLOSED' && (
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setApplyOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
              >
                Apply now
                <ExternalIcon />
              </button>
              {questionCount > 0 && (
                <p className="text-xs text-moons-muted">
                  This employer asks {questionCount} screening question
                  {questionCount === 1 ? '' : 's'} after you click Apply.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4">
          <JobTags job={job} size="md" />
        </div>

        <div className="mb-6">
          <JobCompanyHeader job={job} />
          <PostedByLine job={job} className="mt-2" />
        </div>

        <CompanyProfileCard job={job} recruiterId={job.recruiterId} />

        <section className="mt-6">
          <h2 className="text-base font-bold text-heading">About the job</h2>
          <div className="mt-3">
            <RichTextContent content={job.description} />
          </div>
        </section>
      </div>

      {isCandidate && !applied && job.status !== 'CLOSED' && (
        <ApplyJobModal
          open={applyOpen}
          job={job}
          onClose={() => setApplyOpen(false)}
          onSubmitted={() => setApplied(true)}
        />
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ExperienceIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
