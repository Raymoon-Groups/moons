'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus, UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import type { ApplicantRow } from '@/lib/types';

const STATUS_OPTIONS = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.VIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
];

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    authFetch<ApplicantRow[]>(`/applications/job/${jobId}`)
      .then(setApplicants)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [jobId, router]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/recruiter/jobs" className="text-sm text-moons-blue hover:underline">
        ← My jobs
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">Applicants</h1>
      <p className="mt-1 text-sm text-moons-muted">
        Review candidates, download resumes, and update application status
      </p>

      {loading && <p className="mt-6 text-sm text-moons-muted">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {!loading && applicants.length === 0 && (
          <p className="rounded-lg border border-border bg-surface-elevated p-8 text-center text-sm text-moons-muted">
            No applicants yet.
          </p>
        )}
        {applicants.map((app) => {
          const profile = app.candidate.profile;
          const name = profile?.fullName ?? app.candidate.email;
          const avatarSrc = resolveAssetUrl(profile?.avatarUrl);
          const resumeUrl = profile?.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
          const expLabel =
            profile?.experienceYears != null
              ? profile.experienceYears === 0
                ? 'Fresher'
                : `${profile.experienceYears} yrs exp`
              : null;

          return (
            <div
              key={app.id}
              className="rounded-lg border border-border bg-surface-elevated p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-moons-blue/10">
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
                    <p className="font-semibold text-moons-navy">{name}</p>
                    {profile?.headline && (
                      <p className="text-sm text-foreground">{profile.headline}</p>
                    )}
                    {profile?.currentCompany && (
                      <p className="text-sm text-moons-muted">{profile.currentCompany}</p>
                    )}
                    <p className="mt-1 text-xs text-moons-muted">
                      {[profile?.location, expLabel, profile?.noticePeriod]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {(profile?.currentCtc || profile?.expectedCtc) && (
                      <p className="mt-1 text-xs text-moons-muted">
                        CTC: {profile.currentCtc || '—'} → {profile.expectedCtc || '—'}
                      </p>
                    )}
                    <p className="text-xs text-moons-muted">{app.candidate.email}</p>
                    {profile?.phone && (
                      <p className="text-xs text-moons-muted">{profile.phone}</p>
                    )}
                    {profile?.skills?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.skills.slice(0, 8).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-surface px-2 py-0.5 text-xs text-foreground"
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
                      <p className="mt-3 line-clamp-2 text-sm text-foreground">{profile.summary}</p>
                    )}
                    {app.coverNote && (
                      <p className="mt-3 text-sm text-foreground">
                        <span className="font-medium">Cover note:</span> {app.coverNote}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-moons-muted">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/recruiter/candidates/${app.candidate.id}`}
                        className="rounded-full bg-moons-blue px-4 py-1.5 text-xs font-semibold hover:bg-moons-blue-dark hover:text-white"
                      >
                        View full profile
                      </Link>
                      {resumeUrl && (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-moons-blue px-4 py-1.5 text-xs font-semibold text-moons-blue hover:bg-surface-hover"
                        >
                          Download resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <select
                  value={app.status}
                  disabled={updatingId === app.id}
                  onChange={(e) =>
                    updateStatus(app.id, e.target.value as ApplicationStatus)
                  }
                  className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-moons-blue"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
