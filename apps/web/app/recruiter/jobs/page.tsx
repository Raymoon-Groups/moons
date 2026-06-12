'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { JobCompanyHeader } from '@/components/job-company-header';
import { authDelete, authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

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

  async function handleClose(job: JobListing) {
    if (!window.confirm(`Close "${job.title}"? It will no longer accept applications.`)) return;
    setClosingId(job.id);
    setError('');
    try {
      await authFetch(`/jobs/${job.id}/close`, { method: 'POST' });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'CLOSED' } : j)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close job');
    } finally {
      setClosingId(null);
    }
  }

  async function handleDelete(job: JobListing) {
    const confirmed = window.confirm(
      `Delete "${job.title}"?\n\nThis will remove the job and all applications for it. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(job.id);
    setError('');
    try {
      await authDelete(`/jobs/${job.id}`);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-moons-blue hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-bold text-moons-navy">My posted jobs</h1>
          <p className="mt-1 text-sm text-moons-muted">Post, manage, and review applicants</p>
        </div>
        <Link
          href="/recruiter/jobs/new"
          className="rounded-md bg-moons-orange px-4 py-2 text-sm font-bold text-white hover:bg-moons-orange-dark"
        >
          + Post job
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-moons-muted">Loading…</p>}
      {error && <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {!loading && jobs.length === 0 && (
          <p className="rounded-lg border border-border bg-surface-elevated p-8 text-center text-sm text-moons-muted">
            No jobs posted yet.{' '}
            <Link href="/recruiter/jobs/new" className="text-moons-blue hover:underline">
              Post your first job
            </Link>
          </p>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-lg border border-border bg-surface-elevated p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-semibold text-moons-navy hover:text-moons-blue hover:underline"
                >
                  {job.title}
                </Link>
                <div className="mt-2">
                  <JobCompanyHeader job={job} size="sm" />
                </div>
                <p className="mt-2 text-xs text-moons-muted">
                  {job.location} · {job.employmentType.replace('_', ' ')} · {job.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/recruiter/jobs/${job.id}/applicants`}
                  className="rounded-md border border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-surface-hover"
                >
                  View applicants
                </Link>
                <Link
                  href={`/recruiter/jobs/${job.id}/edit`}
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-moons-silver hover:border-moons-blue"
                >
                  Edit
                </Link>
                {job.status === 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={() => handleClose(job)}
                    disabled={closingId === job.id}
                    className="rounded-md border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                  >
                    {closingId === job.id ? 'Closing…' : 'Close'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(job)}
                  disabled={deletingId === job.id}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingId === job.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
