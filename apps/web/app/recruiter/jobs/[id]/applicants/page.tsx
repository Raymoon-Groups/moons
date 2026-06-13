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
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-surface ring-2 ring-moons-blue/10">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-moons-blue text-lg font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ApplicationStatusBadge status={app.status} />
              <span className="text-xs text-moons-muted">
                Applied{' '}
                {new Date(app.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-moons-navy">{name}</p>
            {profile?.headline && (
              <p className="mt-1 text-sm text-foreground">{profile.headline}</p>
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

            <p className="mt-1 text-xs text-moons-muted">{app.candidate.email}</p>
            {profile?.phone && <p className="text-xs text-moons-muted">{profile.phone}</p>}

            {profile?.skills?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground"
                  >
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
              <p className="mt-3 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-foreground">
                <span className="font-semibold text-moons-navy">Cover note:</span> {app.coverNote}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[200px]">
          <Link
            href={`/recruiter/candidates/${app.candidate.id}`}
            className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
          >
            View full profile
          </Link>
          {resumeUrl && resumeFileName && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
            >
              <span className="truncate">{resumeFileName}</span>
            </a>
          )}

          <label className="mt-1 block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
              Update status
            </span>
            <select
              value={app.status}
              disabled={updatingId === app.id}
              onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-moons-navy outline-none transition focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30 disabled:opacity-60"
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
    </article>
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
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f0f3f8] text-sm text-moons-muted">
        Loading applicants…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href={`/recruiter/jobs/${jobId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← Back to job
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                Applicants
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-moons-navy md:text-3xl">
                {job?.title ?? 'Job applicants'}
              </h1>
              <p className="mt-2 text-sm text-moons-muted">
                Review candidates, download resumes, and update application status.
              </p>
              {job && (
                <p className="mt-2 text-sm text-moons-muted">
                  <span className="font-semibold text-foreground">{job.companyName}</span>
                  {job.location ? ` · ${job.location}` : ''}
                </p>
              )}
            </section>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {!loading && applicants.length === 0 && (
              <div className="rounded-xl border border-dashed border-moons-blue/40 bg-white p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-moons-navy">No applicants yet</p>
                <p className="mt-2 text-sm text-moons-muted">
                  When candidates apply to this job, they will appear here for review.
                </p>
                <Link
                  href={`/jobs?job=${jobId}`}
                  className="mt-5 inline-flex rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
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
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Pipeline</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Total applicants</dt>
                  <dd className="font-semibold text-moons-navy">{stats.total}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">New</dt>
                  <dd className="font-semibold text-amber-700">{stats.new}</dd>
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
                  href={`/recruiter/jobs/${jobId}`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  View job
                </Link>
                <Link
                  href={`/recruiter/jobs/${jobId}/edit`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  Edit job
                </Link>
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
                <li>Mark applications as Viewed once you have opened a candidate profile.</li>
                <li>Use Shortlisted for candidates you want to move forward with.</li>
                <li>Rejected status notifies the candidate and closes that application.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
