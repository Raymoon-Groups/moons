'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { UserRole } from '@moons/shared';
import { apiFetch, authFetch } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const user = getStoredUser();
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<JobListing>(`/jobs/${id}`);
        setJob(data);
        if (getStoredUser()?.role === UserRole.CANDIDATE && getAccessToken()) {
          const check = await authFetch<{ applied: boolean }>(
            `/applications/check?jobId=${id}`,
          );
          setApplied(check.applied);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Job not found');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    try {
      await authFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId: id, coverNote: coverNote || undefined }),
      });
      setApplied(true);
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading job…</div>;
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-red-600">{error || 'Job not found'}</p>
        <Link href="/jobs" className="mt-4 inline-block text-moons-blue hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/jobs" className="text-sm text-moons-blue hover:underline">
        ← Back to jobs
      </Link>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-moons-navy">{job.title}</h1>
        <p className="mt-1 text-lg text-slate-600">{job.companyName}</p>
        <p className="mt-2 text-sm text-moons-muted">
          {job.location} · {job.employmentType.replace('_', ' ')}
        </p>
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold text-slate-800">Job description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {job.description}
          </p>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-block rounded-md bg-moons-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark"
            >
              Login to apply
            </Link>
          )}

          {isLoggedIn && !isCandidate && (
            <p className="text-sm text-slate-500">
              Log in as a jobseeker to apply for this role.
            </p>
          )}

          {isCandidate && applied && (
            <div>
              <p className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                ✓ You have applied to this job
              </p>
              <Link
                href="/applications"
                className="mt-3 inline-block text-sm text-moons-blue hover:underline"
              >
                View my applications →
              </Link>
            </div>
          )}

          {isCandidate && !applied && (
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Cover note (optional)
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
                  placeholder="Why are you a good fit?"
                />
              </div>
              {applyError && (
                <p className="text-sm text-red-600">{applyError}</p>
              )}
              {applySuccess && (
                <p className="text-sm text-green-700">Application submitted!</p>
              )}
              <button
                type="submit"
                disabled={applying}
                className="rounded-md bg-moons-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark disabled:opacity-60"
              >
                {applying ? 'Applying…' : 'Apply now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
