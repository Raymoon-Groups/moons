'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationStatus, UserRole } from '@moons/shared';
import { authDelete, authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import { formatEmploymentType } from '@/lib/job-formatters';
import type { ApplicationWithJob } from '@/lib/types';

function formatApplicationStatus(status: string) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return 'Submitted';
    case ApplicationStatus.VIEWED:
      return 'Viewed';
    case ApplicationStatus.SHORTLISTED:
      return 'Shortlisted';
    case ApplicationStatus.REJECTED:
      return 'Rejected';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const styles =
    status === ApplicationStatus.SHORTLISTED
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === ApplicationStatus.REJECTED
        ? 'bg-red-50 text-red-700 ring-red-200'
        : status === ApplicationStatus.VIEWED
          ? 'bg-sky-50 text-sky-700 ring-sky-200'
          : 'bg-amber-50 text-amber-800 ring-amber-200';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {formatApplicationStatus(status)}
    </span>
  );
}

function ApplicationCard({
  app,
  withdrawingId,
  onWithdraw,
}: {
  app: ApplicationWithJob;
  withdrawingId: string | null;
  onWithdraw: (app: ApplicationWithJob) => void;
}) {
  const canWithdraw =
    app.status === ApplicationStatus.SUBMITTED || app.status === ApplicationStatus.VIEWED;

  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <span className="text-lg font-bold text-moons-muted">
              {app.job.companyName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ApplicationStatusBadge status={app.status} />
            </div>

            <Link
              href={`/jobs?job=${app.job.id}`}
              className="mt-3 block text-lg font-bold tracking-tight text-moons-navy transition hover:text-moons-blue"
            >
              {app.job.title}
            </Link>

            <p className="mt-1.5 text-sm text-moons-muted">
              <span className="font-semibold text-foreground">{app.job.companyName}</span>
              {app.job.location ? ` · ${app.job.location}` : ''}
            </p>

            <p className="mt-2 text-xs text-moons-muted">
              Applied{' '}
              {new Date(app.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' · '}
              {formatEmploymentType(app.job.employmentType)}
            </p>

            {app.coverNote && (
              <p className="mt-3 line-clamp-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-foreground">
                <span className="font-semibold text-moons-navy">Cover note:</span> {app.coverNote}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[180px]">
          <Link
            href={`/jobs?job=${app.job.id}`}
            className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
          >
            View job
          </Link>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => onWithdraw(app)}
              disabled={withdrawingId === app.id}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {withdrawingId === app.id ? 'Withdrawing…' : 'Withdraw'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const countBy = (status: ApplicationStatus) =>
      applications.filter((a) => a.status === status).length;
    return {
      total: applications.length,
      submitted: countBy(ApplicationStatus.SUBMITTED),
      viewed: countBy(ApplicationStatus.VIEWED),
      shortlisted: countBy(ApplicationStatus.SHORTLISTED),
      rejected: countBy(ApplicationStatus.REJECTED),
    };
  }, [applications]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.CANDIDATE) {
      router.replace('/dashboard');
      return;
    }
    authFetch<ApplicationWithJob[]>('/applications/mine')
      .then(setApplications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleWithdraw(app: ApplicationWithJob) {
    if (!window.confirm(`Withdraw your application for "${app.job.title}"?`)) return;
    setWithdrawingId(app.id);
    setError('');
    try {
      await authDelete(`/applications/${app.id}`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                Jobseeker
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-moons-navy md:text-3xl">
                My applications
              </h1>
              <p className="mt-2 text-sm text-moons-muted">
                Track jobs you have applied to and follow up on your application status.
              </p>
            </section>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {loading && (
              <div className="rounded-xl border border-border bg-white p-10 text-center text-sm text-moons-muted shadow-sm">
                Loading your applications…
              </div>
            )}

            {!loading && applications.length === 0 && (
              <div className="rounded-xl border border-dashed border-moons-blue/40 bg-white p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-moons-navy">No applications yet</p>
                <p className="mt-2 text-sm text-moons-muted">
                  Browse open roles and apply to jobs that match your profile.
                </p>
                <Link
                  href="/jobs"
                  className="mt-5 inline-flex rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  Browse jobs
                </Link>
              </div>
            )}

            {!loading && applications.length > 0 && (
              <div className="space-y-4">
                {applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    withdrawingId={withdrawingId}
                    onWithdraw={handleWithdraw}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Application status</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Total applied</dt>
                  <dd className="font-semibold text-moons-navy">{stats.total}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Submitted</dt>
                  <dd className="font-semibold text-amber-700">{stats.submitted}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Viewed</dt>
                  <dd className="font-semibold text-sky-700">{stats.viewed}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Shortlisted</dt>
                  <dd className="font-semibold text-emerald-700">{stats.shortlisted}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Rejected</dt>
                  <dd className="font-semibold text-red-600">{stats.rejected}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Quick links</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/jobs"
                  className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  Browse jobs
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-moons-navy"
                >
                  Edit profile
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>Keep your profile updated so recruiters see your latest experience.</li>
                <li>You can withdraw applications that are still Submitted or Viewed.</li>
                <li>Shortlisted means the employer wants to move forward with you.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
