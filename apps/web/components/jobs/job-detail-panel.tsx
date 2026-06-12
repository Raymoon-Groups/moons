'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CompanyProfileCard } from '@/components/company-profile-card';
import { JobCompanyHeader } from '@/components/job-company-header';
import { JobTags } from '@/components/jobs/job-tags';
import { apiFetch, authFetch } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth';
import { experienceLevelLabel, formatEmploymentType, formatPostedAgo } from '@/lib/job-formatters';
import { formatJobExperience, type JobListing } from '@/lib/jobs';

function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-foreground">
      <span className="mt-0.5 shrink-0 text-moons-muted">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function JobDetailPanel({
  jobId,
  onClose,
  showClose = false,
}: {
  jobId: string | null;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const user = getStoredUser();
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setApplied(false);
      setApplyError('');
      setApplySuccess(false);
      setCoverNote('');

      try {
        const data = await apiFetch<JobListing>(`/jobs/${jobId}`);
        if (cancelled) return;
        setJob(data);

        if (getStoredUser()?.role === UserRole.CANDIDATE && getAccessToken()) {
          const check = await authFetch<{ applied: boolean }>(
            `/applications/check?jobId=${jobId}`,
          );
          if (!cancelled) setApplied(check.applied);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Job not found');
          setJob(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    if (!jobId) return;
    setApplying(true);
    setApplyError('');
    try {
      await authFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, coverNote: coverNote || undefined }),
      });
      setApplied(true);
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  }

  if (!jobId) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center text-sm text-moons-muted">
        Select a job from the list to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-sm text-moons-muted">
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

  const exp = formatJobExperience(job);
  const companyMeta = [job.industry, job.companyType].filter(Boolean).join(' · ');

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-moons-navy md:text-2xl">{job.title}</h1>
            <p className="mt-1 text-sm text-moons-muted">
              {job.companyName}
              {job.location ? ` · ${job.location}` : ''}
              {' · '}
              {formatPostedAgo(job.createdAt)}
            </p>
          </div>
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-moons-muted hover:bg-surface"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          <MetaRow icon={<BriefcaseIcon />}>
            {formatEmploymentType(job.employmentType)}
            {exp ? ` · ${exp}` : ''}
            {' · '}
            {experienceLevelLabel(job)}
          </MetaRow>
          {companyMeta && (
            <MetaRow icon={<BuildingIcon />}>
              {job.companySize ? `${job.companySize} · ` : ''}
              {companyMeta}
            </MetaRow>
          )}
          {job.salaryRange && (
            <MetaRow icon={<DollarIcon />}>{job.salaryRange}</MetaRow>
          )}
          <MetaRow icon={<ListIcon />}>
            {job.location} · {formatEmploymentType(job.employmentType)}
          </MetaRow>
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
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
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
            <form onSubmit={handleApply} className="w-full space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={applying}
                  className="inline-flex items-center gap-2 rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark disabled:opacity-60"
                >
                  {applying ? 'Applying…' : 'Apply now'}
                  <ExternalIcon />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-moons-muted">
                  Cover note (optional)
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/15"
                  placeholder="Why are you a good fit?"
                />
              </div>
              {applyError && <p className="text-sm text-red-600">{applyError}</p>}
              {applySuccess && <p className="text-sm text-green-700">Application submitted!</p>}
            </form>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4">
          <JobTags job={job} size="md" />
        </div>

        <div className="mb-6">
          <JobCompanyHeader job={job} />
        </div>

        <CompanyProfileCard job={job} recruiterId={job.recruiterId} />

        <section className="mt-6">
          <h2 className="text-base font-bold text-moons-navy">About the job</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {job.description}
          </p>
        </section>
      </div>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
