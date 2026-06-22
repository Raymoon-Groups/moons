'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserRole } from '@moons/shared';
import { MoonsLogo } from '@/components/moons-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { NavUniversalSearch } from '@/components/nav-universal-search';
import { NotificationBell } from '@/components/notification-bell';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';

const publicNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/companies' },
  { label: 'Services', href: '/register' },
  { label: 'For Employers', href: '/register?role=recruiter' },
] as const;

const jobseekerNavLinks = [
  { label: 'Jobs', href: '/jobs' },
  { label: 'Services', href: '/' },
  { label: 'Companies', href: '/companies' },
] as const;

const recruiterNavLinks = [
  { label: 'Jobs', href: '/recruiter/jobs' },
  { label: 'Candidates', href: '/recruiter/candidates' },
] as const;

function isNavActive(pathname: string, label: string) {
  switch (label) {
    case 'Home':
      return pathname === '/';
    case 'Jobs':
      return pathname === '/jobs' || pathname.startsWith('/jobs/');
    case 'Candidates':
      return pathname.startsWith('/recruiter/candidates');
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


function UserIcon() {
  return (
    <svg className="h-4 w-4 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <span className={`flex flex-col justify-center gap-[5px] ${className ?? ''}`} aria-hidden>
      <span className="h-0.5 w-5 rounded-full bg-foreground transition-transform" />
      <span className="h-0.5 w-5 rounded-full bg-foreground" />
      <span className="h-0.5 w-5 rounded-full bg-foreground transition-transform" />
    </span>
  );
}

function DashboardIcon() {
  return (
    <svg className="h-4 w-4 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ProfileMenuButton({
  onLogout,
  pathname,
  extraMenuLinks,
}: {
  onLogout: () => void;
  pathname?: string;
  extraMenuLinks?: readonly { label: string; href: string }[];
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName?.trim() || user?.email.split('@')[0] || 'User';
  const avatarSrc = resolveAvatarUrl(user?.avatarUrl, user?.avatarVersion);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const hasExtraLinks = extraMenuLinks && extraMenuLinks.length > 0;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex shrink-0 items-center gap-2 rounded-full border-2 py-1 pl-1 pr-2.5 transition focus:outline-none focus:ring-2 focus:ring-moons-blue/30 ${
          open
            ? 'border-moons-blue bg-surface-elevated shadow-md'
            : 'border-border bg-surface-elevated shadow-sm hover:border-moons-blue/30'
        }`}
        aria-label={`${displayName} menu`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={displayName}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-sm font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <HamburgerIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg"
        >
          {hasExtraLinks && (
            <div className="border-b border-border py-1">
              {extraMenuLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition hover:bg-surface ${
                    pathname === link.href ? 'text-moons-blue' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          <div className="border-b border-border px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-heading">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-moons-muted">{user.email}</p>
            )}
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-surface ${
              pathname === '/dashboard' ? 'text-moons-blue' : 'text-foreground'
            }`}
          >
            <DashboardIcon />
            Dashboard
          </Link>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            <UserIcon />
            View profile
          </Link>
          <Link
            href="/settings/security"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            <SettingsIcon />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function JobseekerHeader({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[68px] md:gap-4">
      <MoonsLogo size="lg" priority />

      <nav className="hidden shrink-0 items-center gap-1 lg:flex">
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

      <NavUniversalSearch stretched className="min-w-0 flex-1" />

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenuButton onLogout={onLogout} pathname={pathname} />
      </div>
    </div>
  );
}

function RecruiterHeader({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[68px] md:gap-4">
      <MoonsLogo size="lg" priority />

      <nav className="hidden shrink-0 items-center gap-1 lg:flex">
        {recruiterNavLinks.map((link) => {
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

      <NavUniversalSearch stretched className="min-w-0 flex-1" />

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <Link
          href="/recruiter/jobs/new"
          className="hidden rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark md:inline-flex"
        >
          Post a Job
        </Link>
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenuButton onLogout={onLogout} pathname={pathname} />
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
        <JobseekerHeader pathname={pathname} onLogout={handleLogout} />
      </header>
    );
  }

  if (isRecruiter) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/95 shadow-sm backdrop-blur-md">
        <RecruiterHeader pathname={pathname} onLogout={handleLogout} />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/95 shadow-sm backdrop-blur-md">
      {!ready || !user ? (
        <div className="border-b border-border-subtle bg-surface/80">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-3 px-4 text-[11px] text-moons-muted">
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
          </div>
        </div>
      ) : null}

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
                    : 'text-moons-muted hover:text-heading'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {ready && user ? (
            <>
              <NotificationBell />
              <ProfileMenuButton
                onLogout={handleLogout}
                pathname={pathname}
                extraMenuLinks={
                  isRecruiter
                    ? [{ label: 'Post a Job', href: '/recruiter/jobs/new' }]
                    : undefined
                }
              />
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
