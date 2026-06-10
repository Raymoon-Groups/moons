'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (ready && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [ready, user, router]);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (!ready || !user) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">Checking session…</div>
    );
  }

  const isRecruiter = user.role === UserRole.RECRUITER;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-moons-navy">
          Welcome, {user.fullName?.trim() || user.email}
        </h1>
        <p className="mt-1 text-sm text-moons-muted">
          Role: {isRecruiter ? 'Employer' : 'Jobseeker'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-md bg-moons-blue px-4 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark"
          >
            Browse jobs
          </Link>
          <Link
            href="/profile"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-moons-blue"
          >
            My profile
          </Link>
          <Link
            href="/settings/security"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-moons-blue"
          >
            Security
          </Link>

          {!isRecruiter && (
            <Link
              href="/applications"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-moons-blue"
            >
              My applications
            </Link>
          )}

          {isRecruiter && (
            <>
              <Link
                href="/recruiter/jobs"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-moons-blue"
              >
                My posted jobs
              </Link>
              <Link
                href="/recruiter/jobs/new"
                className="rounded-md border border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-blue-50"
              >
                Post a job
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
