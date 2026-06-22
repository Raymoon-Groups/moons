'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import {
  DashBackLink,
  DashContentCard,
  DashErrorCard,
  DashLoadingPage,
  DashPageHero,
  DashPageLayout,
  DashQuickLinks,
  DashSidebarPanel,
} from '@/components/dash/dash-page-shell';
import { CompanyProfileCard } from '@/components/company-profile-card';
import { PostedByLine } from '@/components/job-company-header';
import { JobKeyDetailsGrid } from '@/components/jobs/job-key-details';
import { JobTags } from '@/components/jobs/job-tags';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { getStoredUser } from '@/lib/auth';
import { formatPostedAgo } from '@/lib/job-formatters';
import {
  getEmployerCompanyMeta,
  isPostedByOtherCompany,
  type JobListing,
} from '@/lib/jobs';

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

function StatusBadge({ status }: { status: string }) {
  const isLive = status === 'PUBLISHED';
  const styles = isLive
    ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
    : status === 'CLOSED'
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-heading">{value}</p>
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

  if (loading) return <DashLoadingPage message="Loading job…" />;

  if (error || !job) {
    return (
      <DashErrorCard message={error || 'Job not found'} backHref="/recruiter/jobs" backLabel="← Back to my jobs" />
    );
  }

  const postedByOther = isPostedByOtherCompany(job);
  const companyMeta = postedByOther ? '' : getEmployerCompanyMeta(job);
  const logoSrc =
    !postedByOther && job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;

  return (
    <DashPageLayout
      backLink={
        <DashBackLink href="/recruiter/jobs">← My posted jobs</DashBackLink>
      }
      sidebar={
        <>
          <DashSidebarPanel title="Manage this job">
            <DashQuickLinks
              links={[
                {
                  href: `/recruiter/jobs/${job.id}/applicants`,
                  label: 'View applicants',
                  primary: true,
                },
                { href: `/recruiter/jobs/${job.id}/edit`, label: 'Edit job' },
                { href: `/jobs?job=${job.id}`, label: 'Preview public listing' },
              ]}
            />
          </DashSidebarPanel>

          <DashSidebarPanel title="At a glance">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                <dt className="text-moons-muted">Status</dt>
                <dd className="font-semibold text-heading">{job.status}</dd>
              </div>
              <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                <dt className="text-moons-muted">Hiring for</dt>
                <dd className="text-right font-semibold text-heading">{job.companyName}</dd>
              </div>
              {job.postedByCompanyName &&
                job.postedByCompanyName.trim().toLowerCase() !==
                  job.companyName.trim().toLowerCase() && (
                  <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                    <dt className="text-moons-muted">Posted by</dt>
                    <dd className="text-right font-semibold text-heading">
                      {job.postedByCompanyName}
                    </dd>
                  </div>
                )}
              <div className="flex justify-between gap-3 rounded-lg border border-border/50 bg-surface/50 px-3 py-2">
                <dt className="text-moons-muted">Posted</dt>
                <dd className="font-semibold text-heading">
                  {new Date(job.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </DashSidebarPanel>

          <Link
            href="/recruiter/jobs/new"
            className="block rounded-2xl border border-dashed border-moons-blue/40 bg-moons-blue/[0.04] p-4 text-center text-sm font-semibold text-moons-blue transition hover:border-moons-blue/60 hover:bg-moons-blue/[0.08]"
          >
            + Post another job
          </Link>
        </>
      }
    >
      <DashPageHero
        eyebrow="Job listing"
        eyebrowIcon={<BriefcaseIcon className="h-3.5 w-3.5" />}
        title={job.title}
        subtitle={
          <>
            <span className="font-semibold text-foreground">{job.companyName}</span>
            {job.location ? ` · ${job.location}` : ''}
            {' · '}
            Posted {formatPostedAgo(job.createdAt)}
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-surface to-surface-elevated shadow-sm ring-1 ring-border/50">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-lg font-bold text-white">
                {job.companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <JobTags job={job} size="sm" />
          </div>
        </div>
        <PostedByLine job={job} className="mt-3" />
        {companyMeta ? <p className="mt-2 text-xs text-moons-muted">{companyMeta}</p> : null}
      </DashPageHero>

      <DashContentCard title="Job description">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{job.description}</p>
      </DashContentCard>

      <DashContentCard title="Job details">
        <JobKeyDetailsGrid job={job} />
        {job.companySize ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Company size" value={job.companySize} />
          </dl>
        ) : null}
      </DashContentCard>

      <CompanyProfileCard job={job} recruiterId={job.recruiterId} />
    </DashPageLayout>
  );
}
