'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { JobListing } from '@/lib/jobs';

function JobsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const location = searchParams.get('location') ?? '';

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (location) params.set('location', location);
        const qs = params.toString();
        const data = await apiFetch<JobListing[]>(`/jobs${qs ? `?${qs}` : ''}`);
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [q, location]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-moons-navy">
          {q || location ? 'Search results' : 'All jobs'}
        </h1>
        {(q || location) && (
          <p className="mt-1 text-sm text-moons-muted">
            {q && `Keyword: ${q}`}
            {q && location && ' · '}
            {location && `Location: ${location}`}
          </p>
        )}
      </div>

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading jobs…
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <span className="block mt-2 text-xs">
            Make sure the API is running on port 3001 and Docker DB is up.
          </span>
        </p>
      )}

      {!loading && !error && jobs.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No jobs found. Try a different search or{' '}
          <Link href="/jobs" className="text-moons-blue hover:underline">
            view all jobs
          </Link>
          .
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="border-b border-slate-100 p-4 last:border-b-0 hover:bg-blue-50/40"
          >
            <Link href={`/jobs/${job.id}`} className="text-base font-semibold text-moons-navy hover:text-moons-blue hover:underline">
              {job.title}
            </Link>
            <p className="mt-0.5 text-sm text-slate-600">{job.companyName}</p>
            <p className="mt-1 text-xs text-moons-muted">
              {job.location} · {job.employmentType.replace('_', ' ')}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{job.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading…</div>}>
      <JobsContent />
    </Suspense>
  );
}
