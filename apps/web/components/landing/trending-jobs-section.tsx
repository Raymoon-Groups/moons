'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { JobTags } from '@/components/jobs/job-tags';
import { resolveAssetUrl } from '@/lib/assets';
import { apiFetch } from '@/lib/api-client';
import { formatPostedAgo } from '@/lib/job-formatters';
import { isPostedByOtherCompany, type JobListing } from '@/lib/jobs';

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M11.3 1.046a1 1 0 01.7 1.254l-1.25 4.5h3.96a1 1 0 01.78 1.63l-6.5 8a1 1 0 01-1.72-.73l1.25-4.5H4.34a1 1 0 01-.78-1.63l6.5-8a1 1 0 011.22-.254z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingJobCard({ job, featured }: { job: JobListing; featured?: boolean }) {
  const logoSrc =
    !isPostedByOtherCompany(job) && job.companyLogoUrl
      ? resolveAssetUrl(job.companyLogoUrl)
      : null;
  const initial = job.companyName.charAt(0).toUpperCase();

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_4px_20px_rgba(26,39,68,0.05)] transition duration-300 hover:-translate-y-1 hover:border-moons-blue/30 hover:shadow-[0_12px_40px_rgba(74,127,212,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.22)]"
    >
      <div className="h-1 bg-gradient-to-r from-moons-blue via-moons-blue/60 to-transparent" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-moons-blue/10 to-moons-navy/5 text-base font-bold text-moons-navy dark:text-heading">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-heading transition group-hover:text-moons-blue">
                {job.title}
              </h3>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground/80">{job.companyName}</p>
              <p className="mt-0.5 truncate text-xs text-moons-muted">{job.location}</p>
            </div>
          </div>

          {featured && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-moons-blue/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
              <TrendingIcon className="h-3 w-3" />
              Hot
            </span>
          )}
        </div>

        <div className="mt-4">
          <JobTags job={job} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xs text-moons-muted">{formatPostedAgo(job.createdAt)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-moons-blue transition group-hover:gap-2">
            View job
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated"
        >
          <div className="h-1 bg-moons-blue/20" />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-xl bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-surface" />
                <div className="h-3 w-1/2 rounded bg-surface" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-md bg-surface" />
              <div className="h-6 w-20 rounded-md bg-surface" />
              <div className="h-6 w-24 rounded-md bg-surface" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingJobsSection() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<JobListing[]>('/jobs/trending')
      .then((data) => setJobs(data.slice(0, 4)))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && jobs.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-moons-blue/[0.05] via-surface-elevated to-surface-elevated py-14 md:py-20">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-moons-blue/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-moons-navy/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
              <TrendingIcon className="h-3.5 w-3.5" />
              Trending now
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-heading md:text-3xl">
              Trending jobs on Moons
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-moons-muted md:text-base">
              Roles candidates are applying to right now — explore openings before they fill up.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-border/80 bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-moons-blue/5"
          >
            View all jobs
            <ArrowIcon className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 md:mt-10">
          {loading ? (
            <LoadingGrid />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {jobs.map((job, index) => (
                <TrendingJobCard key={job.id} job={job} featured={index < 2} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
