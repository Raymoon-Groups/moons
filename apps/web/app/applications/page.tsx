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
import { ConfirmModal } from '@/components/confirm-modal';
import { authDelete, authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import { formatEmploymentType } from '@/lib/job-formatters';
import type { ApplicationWithJob } from '@/lib/types';
import {
  CoverNoteBlock,
  ScreeningAnswersList,
} from '@/components/jobs/screening-answers-list';

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
  return <span className="meta-pill">{formatApplicationStatus(status)}</span>;
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
  const appliedDate = new Date(app.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="group overflow-hidden rounded-[28px] border border-border/60 bg-white/90 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.4)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-border/50 bg-gradient-to-r from-moons-blue/[0.08] via-sky-50/60 to-white px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <span className="text-lg font-semibold text-heading">
                {app.job.companyName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <ApplicationStatusBadge status={app.status} />
                <span className="meta-pill bg-white/80">{formatEmploymentType(app.job.employmentType)}</span>
                {app.job.location ? (
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs font-medium text-moons-muted">
                    {app.job.location}
                  </span>
                ) : null}
              </div>

              <Link
                href={`/jobs?job=${app.job.id}`}
                className="mt-3 block text-[1.4rem] font-semibold tracking-tight text-heading transition hover:text-moons-blue sm:text-[1.55rem]"
              >
                {app.job.title}
              </Link>

              <p className="mt-2 text-sm text-moons-muted">
                <span className="font-semibold text-foreground">{app.job.companyName}</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-2 text-sm text-moons-muted shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-moons-blue/10 text-moons-blue">
                    <CalendarIcon />
                  </span>
                  <span>
                    Applied on <span className="font-semibold text-heading">{appliedDate}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:min-w-[190px]">
            <Link
              href={`/jobs?job=${app.job.id}`}
              className="rounded-2xl bg-moons-blue px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_28px_-20px_rgba(59,130,246,0.95)] transition hover:bg-moons-blue-dark"
            >
              View job
            </Link>
            {canWithdraw && (
              <button
                type="button"
                onClick={() => onWithdraw(app)}
                disabled={withdrawingId === app.id}
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                {withdrawingId === app.id ? 'Withdrawing…' : 'Withdraw'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:p-7">
        {app.coverNote && <CoverNoteBlock note={app.coverNote} />}

        <ScreeningAnswersList
          questions={app.job.screeningQuestions}
          answers={app.screeningAnswers}
        />
      </div>
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  const [withdrawTarget, setWithdrawTarget] = useState<ApplicationWithJob | null>(null);

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

  async function executeWithdraw(app: ApplicationWithJob) {
    setWithdrawingId(app.id);
    setError('');
    try {
      await authDelete(`/applications/${app.id}`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      setWithdrawTarget(null);
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
              onWithdraw={(application) => setWithdrawTarget(application)}
            />
          ))}
        </div>
      ) : null}

      <ConfirmModal
        open={!!withdrawTarget}
        tone="warning"
        title="Withdraw application?"
        description={
          withdrawTarget
            ? `Your application for "${withdrawTarget.job.title}" at ${withdrawTarget.job.companyName} will be withdrawn. You can apply again later if the role is still open.`
            : ''
        }
        confirmLabel="Withdraw"
        cancelLabel="Keep application"
        loading={!!withdrawTarget && withdrawingId === withdrawTarget.id}
        onCancel={() => {
          if (!(withdrawTarget && withdrawingId === withdrawTarget.id)) {
            setWithdrawTarget(null);
          }
        }}
        onConfirm={() => {
          if (withdrawTarget) void executeWithdraw(withdrawTarget);
        }}
      />
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
