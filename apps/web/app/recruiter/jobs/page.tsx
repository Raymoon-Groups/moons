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
  const styles =
    status === 'PUBLISHED'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'CLOSED'
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-surface text-moons-muted ring-border';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {status === 'PUBLISHED' ? 'Live' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
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

  return (
    <article className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="text-lg font-bold text-moons-muted">
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
              className="mt-3 block text-lg font-bold tracking-tight text-heading transition hover:text-moons-blue"
            >
              {job.title}
            </Link>

            <p className="mt-1.5 text-sm text-moons-muted">
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

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[200px]">
          <Link
            href={`/recruiter/jobs/${job.id}`}
            className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
          >
            View job
          </Link>
          <Link
            href={`/recruiter/jobs/${job.id}/applicants`}
            className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue hover:bg-surface"
          >
            View applicants
          </Link>
          <Link
            href={`/recruiter/jobs/${job.id}/edit`}
            className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-heading"
          >
            Edit job
          </Link>

          <div className="mt-1 flex gap-2">
            {job.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => onClose(job)}
                disabled={closingId === job.id}
                className="flex-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
              >
                {closingId === job.id ? 'Closing…' : 'Close'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(job)}
              disabled={deletingId === job.id}
              className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {deletingId === job.id ? 'Deleting…' : 'Delete'}
            </button>
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

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← Dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                    Recruiter
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading md:text-3xl">
                    My posted jobs
                  </h1>
                  <p className="mt-2 text-sm text-moons-muted">
                    Manage listings, review applicants, and keep your openings up to date.
                  </p>
                </div>
                <Link
                  href="/recruiter/jobs/new"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  + Post a job
                </Link>
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {loading && (
              <div className="rounded-xl border border-border bg-surface-elevated p-10 text-center text-sm text-moons-muted shadow-sm">
                Loading your jobs…
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="rounded-xl border border-dashed border-moons-blue/40 bg-surface-elevated p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-heading">No jobs posted yet</p>
                <p className="mt-2 text-sm text-moons-muted">
                  Create your first listing to start receiving applications from candidates.
                </p>
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-5 inline-flex rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
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
            <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Overview</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Total listings</dt>
                  <dd className="font-semibold text-heading">{stats.total}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Live</dt>
                  <dd className="font-semibold text-emerald-700">{stats.live}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Closed</dt>
                  <dd className="font-semibold text-amber-700">{stats.closed}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Quick actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/recruiter/jobs/new"
                  className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  Post a new job
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue hover:bg-surface"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-heading"
                >
                  Company profile
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>Keep live listings updated so candidates see accurate role details.</li>
                <li>Close jobs when the role is filled instead of deleting them.</li>
                <li>Review applicants regularly from each job&apos;s applicants page.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
