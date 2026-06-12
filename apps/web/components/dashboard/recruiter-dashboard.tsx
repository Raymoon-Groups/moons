'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface RecruiterStats {
  jobsCount: number;
  activeJobsCount: number;
  applicantsCount: number;
}

export function RecruiterDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null);
  const [stats, setStats] = useState<RecruiterStats | null>(null);

  useEffect(() => {
    authFetch<{ completionPercent: number }>('/profiles/me')
      .then((p) => setProfileCompletion(p.completionPercent))
      .catch(() => undefined);
    authFetch<RecruiterStats>('/jobs/mine/stats')
      .then(setStats)
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const displayName = user?.fullName?.trim() || user?.email || 'Employer';

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-moons-navy">Welcome, {displayName}</h1>
          <p className="mt-1 text-sm text-moons-muted">Employer dashboard</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {profileCompletion != null && (
              <div className="rounded-lg bg-surface p-4">
                <p className="text-2xl font-bold text-moons-navy">{profileCompletion}%</p>
                <p className="text-xs text-moons-muted">Profile complete</p>
              </div>
            )}
            {stats && (
              <>
                <div className="rounded-lg bg-surface p-4">
                  <p className="text-2xl font-bold text-moons-navy">{stats.activeJobsCount}</p>
                  <p className="text-xs text-moons-muted">Active jobs</p>
                </div>
                <div className="rounded-lg bg-surface p-4">
                  <p className="text-2xl font-bold text-moons-navy">{stats.applicantsCount}</p>
                  <p className="text-xs text-moons-muted">Total applicants</p>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/recruiter/jobs/new" className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark">
              Post a job
            </Link>
            <Link href="/recruiter/jobs" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-moons-navy hover:border-moons-blue">
              My posted jobs
            </Link>
            <Link href="/profile" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-moons-navy hover:border-moons-blue">
              Company profile
            </Link>
            <Link href="/settings" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-moons-navy hover:border-moons-blue">
              Settings
            </Link>
            <button type="button" onClick={handleLogout} className="rounded-lg px-4 py-2 text-sm font-medium text-moons-muted hover:text-red-600">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
