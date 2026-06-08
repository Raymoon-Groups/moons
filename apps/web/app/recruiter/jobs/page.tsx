'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
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
    authFetch<JobListing[]>('/jobs/mine')
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-moons-navy">My posted jobs</h1>
          <p className="mt-1 text-sm text-moons-muted">Manage jobs and view applicants</p>
        </div>
        <Link
          href="/recruiter/jobs/new"
          className="rounded-md bg-moons-orange px-4 py-2 text-sm font-bold text-white hover:bg-moons-orange-dark"
        >
          + Post job
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {!loading && jobs.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            No jobs posted yet.{' '}
            <Link href="/recruiter/jobs/new" className="text-moons-blue hover:underline">
              Post your first job
            </Link>
          </p>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0"
          >
            <div>
              <Link
                href={`/jobs/${job.id}`}
                className="font-semibold text-moons-navy hover:text-moons-blue hover:underline"
              >
                {job.title}
              </Link>
              <p className="text-sm text-slate-600">{job.companyName}</p>
              <p className="text-xs text-moons-muted">
                {job.location} · {job.status}
              </p>
            </div>
            <Link
              href={`/recruiter/jobs/${job.id}/applicants`}
              className="rounded-md border border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-blue-50"
            >
              View applicants
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
