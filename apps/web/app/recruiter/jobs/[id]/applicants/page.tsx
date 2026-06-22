'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ApplicationStatus, UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import { getResumeDisplayName } from '@/components/profile/profile-shared';
import type { JobListing } from '@/lib/jobs';
import type { ApplicantRow } from '@/lib/types';

const STATUS_OPTIONS = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.VIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
] as const;

function formatApplicationStatus(status: string) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return 'New';
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

function statusAccentClass(status: string) {
  switch (status) {
    case ApplicationStatus.SHORTLISTED:
      return 'bg-gradient-to-r from-emerald-500 via-emerald-400/80 to-transparent';
    case ApplicationStatus.REJECTED:
      return 'bg-gradient-to-r from-red-500 via-red-400/80 to-transparent';
    case ApplicationStatus.VIEWED:
      return 'bg-gradient-to-r from-sky-500 via-sky-400/80 to-transparent';
    default:
      return 'bg-gradient-to-r from-amber-500 via-amber-400/80 to-transparent';
  }
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const styles =
    status === ApplicationStatus.SHORTLISTED
      ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
      : status === ApplicationStatus.REJECTED
        ? 'bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300'
        : status === ApplicationStatus.VIEWED
          ? 'bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300'
          : 'bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-200';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {formatApplicationStatus(status)}
    </span>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  );
}

function ApplicantCard({
  app,
  updatingId,
  onStatusChange,
}: {
  app: ApplicantRow;
  updatingId: string | null;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
}) {
  const profile = app.candidate.profile;
  const name = profile?.fullName ?? app.candidate.email;
  const avatarSrc = resolveAssetUrl(profile?.avatarUrl);
  const resumeUrl = profile?.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = profile ? getResumeDisplayName(profile) : null;
  const expLabel =
    profile?.experienceYears != null
      ? profile.experienceYears === 0
        ? 'Fresher'
        : `${profile.experienceYears} yrs exp`
      : null;

  return (
    <article className="recruiter-job-card group">
      <div className={`h-1 ${statusAccentClass(app.status)}`} />

      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-surface to-surface-elevated shadow-sm ring-2 ring-moons-blue/15 transition group-hover:ring-moons-blue/30">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-xl font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ApplicationStatusBadge status={app.status} />
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-moons-muted ring-1 ring-border/80">
                  Applied{' '}
                  {new Date(app.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p className="mt-3 text-xl font-bold tracking-tight text-heading">{name}</p>
              {profile?.headline && (
                <p className="mt-1 text-sm font-medium text-foreground">{profile.headline}</p>
              )}
              {profile?.currentCompany && (
                <p className="text-sm text-moons-muted">{profile.currentCompany}</p>
              )}

              <p className="mt-2 text-xs text-moons-muted">
                {[profile?.location, expLabel, profile?.noticePeriod]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              {(profile?.currentCtc || profile?.expectedCtc) && (
                <p className="mt-1 text-xs text-moons-muted">
                  CTC: {profile.currentCtc || '—'} → {profile.expectedCtc || '—'}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-moons-muted">
                <span>{app.candidate.email}</span>
                {profile?.phone ? <span>{profile.phone}</span> : null}
              </div>

              {profile?.skills?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 8).map((s) => (
                    <span key={s} className="skill-chip">
                      {s}
                    </span>
                  ))}
                  {profile.skills.length > 8 && (
                    <span className="text-xs text-moons-muted">
                      +{profile.skills.length - 8} more
                    </span>
                  )}
                </div>
              ) : null}

              {profile?.summary && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground">
                  {profile.summary}
                </p>
              )}

              {app.coverNote && (
                <p className="mt-3 rounded-xl border border-border/70 bg-surface/60 px-3.5 py-2.5 text-sm text-foreground">
                  <span className="font-semibold text-heading">Cover note:</span> {app.coverNote}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-surface/50 p-3 sm:min-w-[210px]">
            <Link
              href={`/recruiter/candidates/${app.candidate.id}`}
              className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md"
            >
              View full profile
            </Link>
            {resumeUrl && resumeFileName && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
              >
                <svg
                  className="h-4 w-4 shrink-0 text-moons-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate">{resumeFileName}</span>
              </a>
            )}

            <label className="mt-1 block border-t border-border/60 pt-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
                Update status
              </span>
              <select
                value={app.status}
                disabled={updatingId === app.id}
                onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium text-heading outline-none transition focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/20 disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatApplicationStatus(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </article>
  );
}

function PipelineStat({
  label,
  value,
  colorClass,
  barClass,
  total,
}: {
  label: string;
  value: number;
  colorClass: string;
  barClass: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-moons-muted">{label}</span>
        <span className={`text-lg font-bold tabular-nums ${colorClass}`}>{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobListing | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const countBy = (status: ApplicationStatus) =>
      applicants.filter((a) => a.status === status).length;
    return {
      total: applicants.length,
      new: countBy(ApplicationStatus.SUBMITTED),
      viewed: countBy(ApplicationStatus.VIEWED),
      shortlisted: countBy(ApplicationStatus.SHORTLISTED),
      rejected: countBy(ApplicationStatus.REJECTED),
    };
  }, [applicants]);

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

    Promise.all([
      authFetch<JobListing>(`/jobs/mine/${jobId}`),
      authFetch<ApplicantRow[]>(`/applications/job/${jobId}`),
    ])
      .then(([jobData, applicantData]) => {
        setJob(jobData);
        setApplicants(applicantData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [jobId, router]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    setError('');
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="dash-page flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-moons-blue/20 border-t-moons-blue" />
          <p className="mt-4 text-sm text-moons-muted">Loading applicants…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href={`/recruiter/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated px-3 py-1.5 text-sm font-medium text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-surface-hover"
        >
          ← Back to job
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="recruiter-jobs-hero">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-moons-blue/15 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"
                aria-hidden
              />

              <div className="relative">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Applicants
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-heading md:text-3xl">
                  {job?.title ?? 'Job applicants'}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-moons-muted">
                  Review candidates, download resumes, and update application status.
                </p>
                {job && (
                  <p className="mt-2 text-sm text-moons-muted">
                    <span className="font-semibold text-foreground">{job.companyName}</span>
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                )}
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
                {error}
              </p>
            )}

            {applicants.length === 0 && (
              <div className="rounded-2xl border border-dashed border-moons-blue/35 bg-gradient-to-b from-moons-blue/[0.04] to-surface-elevated p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-moons-blue/10 ring-1 ring-moons-blue/20">
                  <UsersIcon className="h-7 w-7 text-moons-blue" />
                </div>
                <p className="mt-5 text-base font-semibold text-heading">No applicants yet</p>
                <p className="mt-2 text-sm text-moons-muted">
                  When candidates apply to this job, they will appear here for review.
                </p>
                <Link
                  href={`/jobs?job=${jobId}`}
                  className="mt-6 inline-flex rounded-xl border border-border bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-heading shadow-sm transition hover:border-moons-blue/40 hover:bg-surface-hover"
                >
                  Preview public listing
                </Link>
              </div>
            )}

            {applicants.length > 0 && (
              <div className="space-y-4">
                {applicants.map((app) => (
                  <ApplicantCard
                    key={app.id}
                    app={app}
                    updatingId={updatingId}
                    onStatusChange={updateStatus}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="recruiter-sidebar-card">
              <h3 className="text-sm font-bold text-heading">Pipeline</h3>

              <div className="mt-4 rounded-xl border border-border/60 bg-gradient-to-br from-surface to-surface-elevated p-4 text-center">
                <p className="text-3xl font-bold tabular-nums text-heading">{stats.total}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-moons-muted">
                  Total applicants
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <PipelineStat
                  label="New"
                  value={stats.new}
                  colorClass="text-amber-600"
                  barClass="bg-gradient-to-r from-amber-500 to-amber-400"
                  total={stats.total}
                />
                <PipelineStat
                  label="Viewed"
                  value={stats.viewed}
                  colorClass="text-sky-600"
                  barClass="bg-gradient-to-r from-sky-500 to-sky-400"
                  total={stats.total}
                />
                <PipelineStat
                  label="Shortlisted"
                  value={stats.shortlisted}
                  colorClass="text-emerald-600"
                  barClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
                  total={stats.total}
                />
                <PipelineStat
                  label="Rejected"
                  value={stats.rejected}
                  colorClass="text-red-600"
                  barClass="bg-gradient-to-r from-red-500 to-red-400"
                  total={stats.total}
                />
              </div>
            </div>

            <div className="recruiter-sidebar-card">
              <h3 className="text-sm font-bold text-heading">Quick links</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/recruiter/jobs/${jobId}`}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
                >
                  View job
                </Link>
                <Link
                  href={`/recruiter/jobs/${jobId}/edit`}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover"
                >
                  Edit job
                </Link>
                <Link
                  href="/recruiter/jobs"
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue/40 hover:text-heading"
                >
                  All posted jobs
                </Link>
              </div>
            </div>

            <div className="recruiter-tips-card">
              <h3 className="text-sm font-bold text-heading">Review tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    1
                  </span>
                  <span>Mark applications as Viewed once you have opened a candidate profile.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    2
                  </span>
                  <span>Use Shortlisted for candidates you want to move forward with.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moons-blue/15 text-[10px] font-bold text-moons-blue">
                    3
                  </span>
                  <span>Rejected status notifies the candidate and closes that application.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
