'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { UserRole } from '@moons/shared';
import { MoonsLogo } from '@/components/moons-logo';
import { NotificationBell } from '@/components/notification-bell';
import { useAuth } from '@/lib/auth-context';

const publicNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/jobs' },
  { label: 'Services', href: '/register' },
  { label: 'For Employers', href: '/register?role=recruiter' },
] as const;

const jobseekerNavLinks = [
  { label: 'Jobs', href: '/jobs' },
  { label: 'Services', href: '/' },
  { label: 'Companies', href: '/jobs' },
] as const;

function isNavActive(pathname: string, label: string) {
  switch (label) {
    case 'Home':
      return pathname === '/';
    case 'Jobs':
      return pathname === '/jobs' || pathname.startsWith('/jobs/');
    case 'Companies':
      return pathname.startsWith('/companies');
    case 'Services':
      return pathname === '/register' || pathname === '/login';
    case 'For Employers':
      return pathname.startsWith('/recruiter');
    default:
      return false;
  }
}

function NavUniversalSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : '/jobs');
  }

  return (
    <form onSubmit={handleSubmit} className={`flex min-w-0 items-center ${className}`}>
      <div className="flex w-full items-center rounded-full border border-border bg-surface px-3 py-1.5 shadow-sm focus-within:border-moons-blue/50 focus-within:ring-2 focus-within:ring-moons-blue/15">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs, skills, companies…"
          className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-moons-muted"
        />
      </div>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function JobseekerHeader({ pathname }: { pathname: string }) {
  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-5 md:h-[68px]">
      <MoonsLogo size="lg" priority />

      <nav className="hidden items-center gap-1 lg:flex">
        {jobseekerNavLinks.map((link) => {
          const active = isNavActive(pathname, link.label);
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'text-moons-blue' : 'text-foreground hover:text-moons-blue'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <NavUniversalSearch className="hidden min-w-0 flex-1 sm:flex md:max-w-md lg:max-w-lg" />

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <NotificationBell />
        <Link
          href="/dashboard"
          className="hidden text-sm font-medium text-foreground hover:text-moons-blue sm:inline"
        >
          Dashboard
        </Link>
        <Link
          href="/profile"
          className="rounded-full bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark md:px-5 md:py-2.5"
        >
          My Profile
        </Link>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();

  const isJobseeker = ready && user?.role === UserRole.CANDIDATE;
  const isRecruiter = ready && user?.role === UserRole.RECRUITER;

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (isJobseeker) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/95 shadow-sm backdrop-blur-md">
        <JobseekerHeader pathname={pathname} />
        <div className="border-t border-border-subtle px-4 pb-3 sm:hidden">
          <NavUniversalSearch />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/95 shadow-sm backdrop-blur-md">
      <div className="border-b border-border-subtle bg-surface/80">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-3 px-4 text-[11px] text-moons-muted">
          {ready && user ? (
            <>
              <NotificationBell />
              <span className="text-border">|</span>
              <Link href="/profile" className="hover:text-moons-blue">
                Profile
              </Link>
              <span className="text-border">|</span>
              <Link href="/settings/security" className="hover:text-moons-blue">
                Settings
              </Link>
              <span className="text-border">|</span>
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
              <span className="text-border">|</span>
              <Link href="/login?role=recruiter" className="hover:text-moons-blue">
                Employer Login
              </Link>
              <span className="text-border">|</span>
              <Link href="/register" className="font-semibold text-moons-blue hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-[68px]">
        <MoonsLogo size="lg" priority />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-border bg-surface p-1 md:flex">
          {publicNavLinks.map((link) => {
            const active = isNavActive(pathname, link.label);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-surface-elevated text-moons-blue shadow-sm'
                    : 'text-moons-muted hover:text-moons-navy'
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
                className="hidden text-sm font-medium text-foreground hover:text-moons-blue sm:inline"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
              >
                My Profile
              </Link>
              {isRecruiter && (
                <Link
                  href="/recruiter/jobs/new"
                  className="hidden rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-moons-navy transition hover:border-moons-blue/40 hover:bg-surface-hover lg:inline-block"
                >
                  Post a Job
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-foreground transition hover:text-moons-blue"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
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
