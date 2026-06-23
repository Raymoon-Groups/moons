'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { PostedByLine } from '@/components/job-company-header';
import { JobTags } from '@/components/jobs/job-tags';
import { authDelete, authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import { formatEmploymentType, formatPostedAgo } from '@/lib/job-formatters';
import { isPostedByOtherCompany, type JobListing } from '@/lib/jobs';

function StatusBadge({ status }: { status: string }) {
  const isLive = status === 'PUBLISHED';
  const isClosed = status === 'CLOSED';

  const styles = isLive
    ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
    : isClosed
      ? 'bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-200'
      : 'bg-surface text-moons-muted ring-border';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {isLive ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : null}
      {isLive ? 'Live' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function JobCard({
  job,
  closingId,
  deletingId,
  onClose,
  onDelete,
}: {
  job: JobListing;
  closingId: string | null;
  deletingId: string | null;
  onClose: (job: JobListing) => void;
  onDelete: (job: JobListing) => void;
}) {
  const logoSrc =
    !isPostedByOtherCompany(job) && job.companyLogoUrl
      ? resolveAssetUrl(job.companyLogoUrl)
      : null;

  const accentClass =
    job.status === 'PUBLISHED'
      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400/80 to-transparent'
      : job.status === 'CLOSED'
        ? 'bg-gradient-to-r from-amber-500 via-amber-400/80 to-transparent'
        : 'bg-gradient-to-r from-moons-blue via-moons-blue/70 to-transparent';

  return (
    <article className="recruiter-job-card group">
      <div className={`h-1 ${accentClass}`} />

      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-surface to-surface-elevated shadow-sm ring-1 ring-border/50 transition group-hover:ring-moons-blue/20">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-xl font-bold text-white">
                  {job.companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} />
                <JobTags job={job} size="sm" />
              </div>

              <Link
                href={`/recruiter/jobs/${job.id}`}
                className="mt-3 block text-xl font-bold tracking-tight text-heading transition hover:text-moons-blue"
              >
                {job.title}
              </Link>

              <p className="mt-2 text-sm text-moons-muted">
                <span className="font-semibold text-foreground">{job.companyName}</span>
                {job.location ? ` · ${job.location}` : ''}
                {' · '}
                Posted {formatPostedAgo(job.createdAt)}
              </p>

              <PostedByLine job={job} className="mt-1.5" />

              <p className="mt-2 text-xs text-moons-muted">
                {formatEmploymentType(job.employmentType)}
                {job.salaryRange ? ` · ${job.salaryRange}` : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-surface/50 p-3 sm:min-w-[210px]">
            <Link
              href={`/recruiter/jobs/${job.id}`}
              className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md"
            >
              View job
            </Link>
            <Link
              href={`/recruiter/jobs/${job.id}/applicants`}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
            >
              View applicants
            </Link>
            <Link
              href={`/recruiter/jobs/${job.id}/edit`}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue/40 hover:text-heading"
            >
              Edit job
            </Link>

            <div className="mt-1 flex gap-2 border-t border-border/60 pt-3">
              {job.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => onClose(job)}
                  disabled={closingId === job.id}
                  className="flex-1 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
                >
                  {closingId === job.id ? 'Closing…' : 'Close'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(job)}
                disabled={deletingId === job.id}
                className="flex-1 rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:bg-red-500/10 dark:hover:bg-red-500/15"
              >
                {deletingId === job.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const live = jobs.filter((j) => j.status === 'PUBLISHED').length;
    const closed = jobs.filter((j) => j.status === 'CLOSED').length;
    return { total: jobs.length, live, closed };
  }, [jobs]);

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
    authFetch<JobListing[]>('/jobs/mine')
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleClose(job: JobListing) {
    if (!window.confirm(`Close "${job.title}"? It will no longer accept applications.`)) return;
    setClosingId(job.id);
    setError('');
    try {
      await authFetch(`/jobs/${job.id}/close`, { method: 'POST' });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'CLOSED' } : j)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close job');
    } finally {
      setClosingId(null);
    }
  }

  async function handleDelete(job: JobListing) {
    const confirmed = window.confirm(
      `Delete "${job.title}"?\n\nThis will remove the job and all applications for it. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(job.id);
    setError('');
    try {
      await authDelete(`/jobs/${job.id}`);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  }

  const livePercent = stats.total > 0 ? Math.round((stats.live / stats.total) * 100) : 0;

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated px-3 py-1.5 text-sm font-medium text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-surface-hover"
        >
          ← Dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="recruiter-jobs-hero">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-moons-blue/15 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-moons-navy/10 blur-2xl"
                aria-hidden
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
                    <BriefcaseIcon className="h-3.5 w-3.5" />
                    Recruiter
                  </p>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-heading md:text-3xl">
                    My posted jobs
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-moons-muted">
                    Manage listings, review applicants, and keep your openings up to date.
                  </p>
                </div>
                <Link
                  href="/recruiter/jobs/new"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-moons-blue/25 transition hover:bg-moons-blue-dark hover:shadow-lg hover:shadow-moons-blue/30"
                >
                  <PlusIcon className="h-4 w-4" />
                  Post a job
                </Link>
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
                {error}
              </p>
            )}

            {loading && (
              <div className="rounded-2xl border border-border/70 bg-surface-elevated p-12 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-moons-blue/20 border-t-moons-blue" />
                <p className="mt-4 text-sm text-moons-muted">Loading your jobs…</p>
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-moons-blue/35 bg-gradient-to-b from-moons-blue/[0.04] to-surface-elevated p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-moons-blue/10 ring-1 ring-moons-blue/20">
                  <BriefcaseIcon className="h-7 w-7 text-moons-blue" />
                </div>
                <p className="mt-5 text-base font-semibold text-heading">No jobs posted yet</p>
                <p className="mt-2 text-sm text-moons-muted">
                  Create your first listing to start receiving applications from candidates.
                </p>
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-moons-blue/20 transition hover:bg-moons-blue-dark"
                >
                  <PlusIcon className="h-4 w-4" />
                  Post your first job
                </Link>
              </div>
            )}

            {!loading && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    closingId={closingId}
                    deletingId={deletingId}
                    onClose={handleClose}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="recruiter-sidebar-card">
              <h3 className="text-sm font-bold text-heading">Overview</h3>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="recruiter-stat-tile">
                  <p className="text-2xl font-bold tabular-nums text-heading">{stats.total}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                    Total listings
                  </p>
                </div>
                <div className="recruiter-stat-tile">
                  <p className="text-2xl font-bold tabular-nums text-emerald-600">{stats.live}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                    Live
                  </p>
                </div>
                <div className="recruiter-stat-tile">
                  <p className="text-2xl font-bold tabular-nums text-amber-600">{stats.closed}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                    Closed
                  </p>
                </div>
              </div>

              {stats.total > 0 ? (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-moons-muted">
                    <span>Live share</span>
                    <span className="font-semibold text-emerald-600">{livePercent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${livePercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="recruiter-sidebar-card">
              <h3 className="text-sm font-bold text-heading">Quick actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/recruiter/jobs/new"
                  className="rounded-xl bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md"
                >
                  Post a new job
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue/40 hover:text-heading"
                >
                  Company profile
                </Link>
              </div>
            </div>

            <div className="recruiter-tips-card">
              <h3 className="text-sm font-bold text-heading">Tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    1
                  </span>
                  <span>Keep live listings updated so candidates see accurate role details.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    2
                  </span>
                  <span>Close jobs when the role is filled instead of deleting them.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    3
                  </span>
                  <span>Review applicants regularly from each job&apos;s applicants page.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
