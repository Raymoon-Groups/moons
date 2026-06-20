'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '@/lib/assets';
import { apiFetch } from '@/lib/api-client';
import { formatJobExperience, type JobListing } from '@/lib/jobs';

export function TrendingJobsSection() {
  const [jobs, setJobs] = useState<JobListing[]>([]);

  useEffect(() => {
    apiFetch<JobListing[]>('/jobs/trending')
      .then(setJobs)
      .catch(() => setJobs([]));
  }, []);

  if (jobs.length === 0) return null;

  return (
    <section className="bg-surface-elevated py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-heading md:text-xl">Trending jobs on Moons</h2>
          <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
            View all jobs →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {jobs.map((job) => {
            const logo = job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;
            const exp = formatJobExperience(job);
            return (
              <article
                key={job.id}
                className="flex min-h-[200px] flex-col justify-between rounded-2xl bg-surface p-6"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-sm font-bold text-moons-muted">
                      {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        job.companyName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-heading">{job.title}</h3>
                      <p className="text-sm text-moons-muted">
                        {job.companyName} · {job.location}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-moons-muted">
                    {[exp, job.salaryRange, job.employmentType.replace('_', ' ')].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-block rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
                  >
                    View job
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
