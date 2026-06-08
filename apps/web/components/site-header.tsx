'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';

export function SiteHeader() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Account';
  const avatarSrc = resolveAvatarUrl(user?.avatarUrl, user?.avatarVersion);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#f4f6f9]">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-3 px-4 text-[11px] text-slate-600">
          {ready && user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-moons-blue">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moons-blue text-[10px] font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold text-moons-navy">{displayName}</span>
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/profile" className="hover:text-moons-blue">
                Profile
              </Link>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-moons-blue">
                Jobseeker Login
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/login?role=recruiter" className="hover:text-moons-blue">
                Employer Login
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/register" className="font-semibold text-moons-blue hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-[22px] font-extrabold tracking-tight text-moons-navy">
            moons
          </span>
          <span className="rounded bg-moons-blue px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            jobs
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-slate-700 md:flex">
          <Link href="/jobs" className="text-moons-blue">
            Jobs
          </Link>
          <Link href="/jobs" className="hover:text-moons-blue">
            Companies
          </Link>
          <Link href="/register" className="hover:text-moons-blue">
            Services
          </Link>
          <Link href="/register?role=recruiter" className="hover:text-moons-blue">
            For Employers
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {ready && user ? (
            <Link
              href="/dashboard"
              className="rounded bg-moons-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-moons-orange-dark"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register?role=recruiter"
                className="hidden rounded border border-moons-blue px-3 py-1.5 text-xs font-bold text-moons-blue hover:bg-blue-50 sm:inline-block"
              >
                Post a Job
              </Link>
              <Link
                href="/register"
                className="rounded bg-moons-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-moons-orange-dark"
              >
                Register Free
              </Link>
            </>
          )}
          {ready && user?.role === UserRole.RECRUITER && (
            <Link
              href="/recruiter/jobs/new"
              className="hidden rounded border border-moons-blue px-3 py-1.5 text-xs font-bold text-moons-blue hover:bg-blue-50 sm:inline-block"
            >
              Post a Job
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
