'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { MoonsLogo } from '@/components/moons-logo';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/jobs' },
  { label: 'Services', href: '/register' },
  { label: 'For Employers', href: '/register?role=recruiter' },
] as const;

function isNavActive(pathname: string, label: string) {
  switch (label) {
    case 'Home':
      return pathname === '/';
    case 'Jobs':
      return pathname === '/jobs' || pathname.startsWith('/jobs/');
    case 'Companies':
      return false;
    case 'Services':
      return pathname === '/register' || pathname === '/login';
    case 'For Employers':
      return pathname.startsWith('/recruiter');
    default:
      return false;
  }
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
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
              <Link href="/settings/security" className="hover:text-moons-blue">
                Settings
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

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-[68px]">
        <MoonsLogo size="lg" priority />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full bg-slate-100 p-1 md:flex">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.label);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-moons-navy shadow-sm'
                    : 'text-slate-600 hover:text-moons-navy'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {ready && user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-slate-700 hover:text-moons-navy sm:inline"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-moons-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                My Account
              </Link>
              {user.role === UserRole.RECRUITER && (
                <Link
                  href="/recruiter/jobs/new"
                  className="hidden rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-moons-navy transition hover:bg-slate-50 lg:inline-block"
                >
                  Post a Job
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 transition hover:text-moons-navy"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-moons-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
