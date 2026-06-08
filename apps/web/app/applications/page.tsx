'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { ApplicationWithJob } from '@/lib/types';

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.CANDIDATE) {
      router.replace('/dashboard');
      return;
    }
    authFetch<ApplicationWithJob[]>('/applications/mine')
      .then(setApplications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-moons-blue hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">My applications</h1>
      <p className="mt-1 text-sm text-moons-muted">Track jobs you have applied to</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {!loading && applications.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            No applications yet.{' '}
            <Link href="/jobs" className="text-moons-blue hover:underline">
              Browse jobs
            </Link>
          </p>
        )}
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0"
          >
            <div>
              <Link
                href={`/jobs/${app.job.id}`}
                className="font-semibold text-moons-navy hover:text-moons-blue hover:underline"
              >
                {app.job.title}
              </Link>
              <p className="text-sm text-slate-600">{app.job.companyName}</p>
              <p className="text-xs text-moons-muted">
                {app.job.location} · Applied {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                app.status === 'SHORTLISTED'
                  ? 'bg-green-100 text-green-800'
                  : app.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
