'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { CompanyProfileCard } from '@/components/company-profile-card';
import { PostedByLine } from '@/components/job-company-header';
import { JobKeyDetailsGrid } from '@/components/jobs/job-key-details';
import { JobTags } from '@/components/jobs/job-tags';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import {
  formatPostedAgo,
} from '@/lib/job-formatters';
import {
  getEmployerCompanyMeta,
  isPostedByOtherCompany,
  type JobListing,
} from '@/lib/jobs';

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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-moons-navy">{value}</p>
    </div>
  );
}

export default function RecruiterJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    authFetch<JobListing>(`/jobs/mine/${jobId}`)
      .then(setJob)
      .catch((err) => setError(err instanceof Error ? err.message : 'Job not found'))
      .finally(() => setLoading(false));
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f0f3f8] text-sm text-moons-muted">
        Loading job…
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-[50vh] bg-[#f0f3f8] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{error || 'Job not found'}</p>
          <Link
            href="/recruiter/jobs"
            className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline"
          >
            ← Back to my jobs
          </Link>
        </div>
      </div>
    );
  }

  const postedByOther = isPostedByOtherCompany(job);
  const companyMeta = postedByOther ? '' : getEmployerCompanyMeta(job);
  const logoSrc =
    !postedByOther && job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← My posted jobs
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          {/* Main column */}
          <div className="min-w-0 space-y-5">
            {/* Header card */}
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                  {logoSrc ? (
                    <img src={logoSrc} alt="" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <span className="text-xl font-bold text-moons-muted">
                      {job.companyName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={job.status} />
                    <JobTags job={job} size="sm" />
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-moons-navy md:text-3xl">
                    {job.title}
                  </h1>

                  <p className="mt-2 text-sm text-moons-muted">
                    <span className="font-semibold text-foreground">{job.companyName}</span>
                    {job.location ? ` · ${job.location}` : ''}
                    {' · '}
                    Posted {formatPostedAgo(job.createdAt)}
                  </p>

                  <PostedByLine job={job} className="mt-2" />

                  {companyMeta && (
                    <p className="mt-2 text-xs text-moons-muted">{companyMeta}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-moons-navy">Job description</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {job.description}
              </p>
            </section>

            {/* Details grid */}
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-moons-navy">Job details</h2>
              <div className="mt-4">
                <JobKeyDetailsGrid job={job} />
                {job.companySize && (
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Company size" value={job.companySize} />
                  </dl>
                )}
              </div>
            </section>

            {/* Employer profile */}
            <CompanyProfileCard job={job} recruiterId={job.recruiterId} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Manage this job</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/recruiter/jobs/${job.id}/applicants`}
                  className="rounded-lg bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
                >
                  View applicants
                </Link>
                <Link
                  href={`/recruiter/jobs/${job.id}/edit`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  Edit job
                </Link>
                <Link
                  href={`/jobs?job=${job.id}`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-moons-navy"
                >
                  Preview public listing
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">At a glance</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Status</dt>
                  <dd className="font-semibold text-moons-navy">{job.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Hiring for</dt>
                  <dd className="text-right font-semibold text-moons-navy">{job.companyName}</dd>
                </div>
                {job.postedByCompanyName &&
                  job.postedByCompanyName.trim().toLowerCase() !==
                    job.companyName.trim().toLowerCase() && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-moons-muted">Posted by</dt>
                      <dd className="text-right font-semibold text-moons-navy">
                        {job.postedByCompanyName}
                      </dd>
                    </div>
                  )}
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Posted</dt>
                  <dd className="font-semibold text-moons-navy">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <Link
              href="/recruiter/jobs/new"
              className="block rounded-xl border border-dashed border-moons-blue/40 bg-blue-50/50 p-4 text-center text-sm font-semibold text-moons-blue transition hover:bg-blue-50"
            >
              + Post another job
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
