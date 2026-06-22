'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationStatus, UserRole } from '@moons/shared';
import {
  DashBackLink,
  DashEmptyState,
  DashErrorBanner,
  DashPageHero,
  DashPageLayout,
  DashQuickLinks,
  DashSidebarPanel,
  DashTipsList,
} from '@/components/dash/dash-page-shell';
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
      ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
      : status === ApplicationStatus.REJECTED
        ? 'border-red-200/80 bg-red-50 text-red-700'
        : status === ApplicationStatus.VIEWED
          ? 'border-sky-200/80 bg-sky-50 text-sky-700'
          : 'border-amber-200/80 bg-amber-50 text-amber-800';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
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

  const accentColor =
    app.status === ApplicationStatus.SHORTLISTED
      ? 'from-emerald-500 to-emerald-600'
      : app.status === ApplicationStatus.REJECTED
        ? 'from-red-500 to-red-600'
        : app.status === ApplicationStatus.VIEWED
          ? 'from-sky-500 to-sky-600'
          : 'from-amber-400 to-amber-500';

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_4px_24px_rgba(26,39,68,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(26,39,68,0.1)]">
      <div className={`h-1 bg-gradient-to-r ${accentColor}`} />
      <div className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-moons-blue/10 to-moons-navy/5 shadow-sm">
              <span className="text-lg font-bold text-heading">
                {app.job.companyName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ApplicationStatusBadge status={app.status} />
              </div>

              <Link
                href={`/jobs?job=${app.job.id}`}
                className="mt-3 block text-lg font-bold tracking-tight text-heading transition group-hover:text-moons-blue"
              >
                {app.job.title}
              </Link>

              <p className="mt-1.5 text-sm text-moons-muted">
                <span className="font-semibold text-foreground">{app.job.companyName}</span>
                {app.job.location ? ` · ${app.job.location}` : ''}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-moons-muted">
                <CalendarIcon />
                Applied{' '}
                {new Date(app.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                <span className="text-border">·</span>
                {formatEmploymentType(app.job.employmentType)}
              </p>

              {app.coverNote && (
                <p className="mt-3 line-clamp-2 rounded-xl border border-border/60 bg-gradient-to-br from-surface/80 to-surface-elevated px-3.5 py-2.5 text-sm text-foreground">
                  <span className="font-semibold text-heading">Cover note:</span> {app.coverNote}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:min-w-[180px]">
            <Link
              href={`/jobs?job=${app.job.id}`}
              className="rounded-xl bg-moons-navy px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue"
            >
              View job
            </Link>
            {canWithdraw && (
              <button
                type="button"
                onClick={() => onWithdraw(app)}
                disabled={withdrawingId === app.id}
                className="rounded-xl border border-red-200 bg-surface-elevated px-4 py-2.5 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {withdrawingId === app.id ? 'Withdrawing…' : 'Withdraw'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function StatRow({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-3.5 py-2.5">
      <dt className="text-sm text-moons-muted">{label}</dt>
      <dd className={`text-sm font-bold ${colorClass}`}>{value}</dd>
    </div>
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
    <DashPageLayout
      wide
      backLink={<DashBackLink href="/dashboard">← Back to dashboard</DashBackLink>}
      sidebar={
        <>
          <DashSidebarPanel title="Application status">
            <dl className="space-y-2">
              <StatRow label="Total applied" value={stats.total} colorClass="text-heading" />
              <StatRow label="Submitted" value={stats.submitted} colorClass="text-amber-700" />
              <StatRow label="Viewed" value={stats.viewed} colorClass="text-sky-700" />
              <StatRow label="Shortlisted" value={stats.shortlisted} colorClass="text-emerald-700" />
              <StatRow label="Rejected" value={stats.rejected} colorClass="text-red-600" />
            </dl>
          </DashSidebarPanel>

          <DashSidebarPanel title="Shortcuts">
            <DashQuickLinks
              links={[
                { href: '/jobs', label: 'Browse jobs', primary: true },
                { href: '/dashboard', label: 'Back to dashboard' },
                { href: '/profile', label: 'Edit profile' },
              ]}
            />
          </DashSidebarPanel>

          <DashTipsList
            items={[
              'Keep your profile updated so recruiters see your latest experience.',
              'You can withdraw applications that are still Submitted or Viewed.',
              'Shortlisted means the employer wants to move forward with you.',
            ]}
          />
        </>
      }
    >
      <DashPageHero
        eyebrow="Jobseeker"
        title="My applications"
        subtitle="Track jobs you have applied to and follow up on your application status."
      >
        {!loading && applications.length > 0 ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-moons-blue/20 bg-moons-blue/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-moons-blue" />
            <span className="text-sm font-semibold text-heading">
              {stats.total} application{stats.total === 1 ? '' : 's'} tracked
            </span>
          </div>
        ) : null}
      </DashPageHero>

      {error ? <DashErrorBanner message={error} /> : null}

      {loading ? (
        <div className="dash-content-card p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-moons-blue/20 border-t-moons-blue" />
          <p className="mt-4 text-sm text-moons-muted">Loading your applications…</p>
        </div>
      ) : null}

      {!loading && applications.length === 0 ? (
        <DashEmptyState
          icon={<BriefcaseIcon />}
          title="No applications yet"
          description="Browse open roles and apply to jobs that match your profile."
          action={
            <Link
              href="/jobs"
              className="inline-flex rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark"
            >
              Browse jobs
            </Link>
          }
        />
      ) : null}

      {!loading && applications.length > 0 ? (
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
      ) : null}
    </DashPageLayout>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-7 w-7 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
