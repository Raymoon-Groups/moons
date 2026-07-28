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
import { useNavIndicators } from '@/lib/nav-indicators';

function useHeaderScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
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

function HeaderFloat({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`header-float ${className}`}>{children}</div>;
}

function ProfileMenuButton({
  onLogout,
  pathname,
  extraMenuLinks,
  compact = false,
}: {
  onLogout: () => void;
  pathname?: string;
  extraMenuLinks?: readonly { label: string; href: string }[];
  compact?: boolean;
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
        className={`header-float flex shrink-0 items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-moons-blue/20 sm:gap-2.5 ${
          compact ? 'p-1.5' : 'py-1.5 pl-1.5 pr-3 sm:py-2 sm:pl-2 sm:pr-3.5'
        } ${open ? 'ring-2 ring-moons-blue/20' : ''}`}
        aria-label={`${displayName} menu`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={displayName}
      >
        <span
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface ${compact ? 'h-9 w-9' : 'h-9 w-9 sm:h-10 sm:w-10'}`}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-moons-navy text-sm font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <HamburgerIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[min(100vw-2rem,220px)] overflow-hidden rounded-2xl border border-border bg-surface-elevated/95 py-1 shadow-[0_2px_12px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        >
          {hasExtraLinks && (
            <div className="border-b border-border/50 py-1">
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
          <div className="border-b border-border/50 px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-heading">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-moons-muted">{user.email}</p>
            )}
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-surface ${
              pathname === '/profile' || pathname?.startsWith('/profile/')
                ? 'text-moons-blue'
                : 'text-foreground'
            }`}
          >
            <UserIcon />
            Profile
          </Link>
          {isRecruiterLink(user?.role) && (
            <Link
              href="/recruiter/jobs/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface md:hidden"
            >
              Post a Job
            </Link>
          )}
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
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function isRecruiterLink(role?: string) {
  return role === UserRole.RECRUITER;
}

function LandingPublicHeader() {
  return (
    <header className="landing-header sticky top-0 z-50 border-b border-border bg-surface-elevated/95 shadow-sm backdrop-blur-md">
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

      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 md:h-20 md:gap-4">
        <MoonsLogo size="lg" priority />

        <NavUniversalSearch stretched className="hidden min-w-0 flex-1 md:block" />

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeToggle className="!h-10 !w-10 !border-border !bg-surface !shadow-none !backdrop-blur-none" />
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
        </div>
      </div>

      <div className="border-t border-border-subtle px-4 py-2 md:hidden">
        <NavUniversalSearch stretched className="min-w-0 w-full" />
      </div>
    </header>
  );
}

function AuthenticatedHeader({
  pathname,
  onLogout,
  hasUnreadBell,
  isRecruiter,
}: {
  pathname: string;
  onLogout: () => void;
  hasUnreadBell: boolean;
  isRecruiter: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <HeaderFloat className="flex shrink-0 items-center px-2.5 py-1 sm:px-3 sm:py-1.5">
          <MoonsLogo size="md" priority />
        </HeaderFloat>

        <NavUniversalSearch
          floating
          stretched
          className="hidden min-w-0 flex-1 md:block"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
          {isRecruiter && (
            <Link
              href="/recruiter/jobs/new"
              className="header-float hidden items-center border-transparent bg-moons-blue px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-moons-blue-dark md:inline-flex"
            >
              Post a Job
            </Link>
          )}
          <ThemeToggle />
          <NotificationBell hasUnread={hasUnreadBell} />
          <ProfileMenuButton onLogout={onLogout} pathname={pathname} />
        </div>
      </div>

      <div className="mt-2.5 md:hidden">
        <NavUniversalSearch floating stretched className="min-w-0 w-full" />
      </div>
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const { indicators } = useNavIndicators();

  const isJobseeker = ready && user?.role === UserRole.CANDIDATE;
  const isRecruiter = ready && user?.role === UserRole.RECRUITER;
  const scrolled = useHeaderScrolled();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (pathname === '/' && (!ready || !user)) {
    return <LandingPublicHeader />;
  }

  if (isJobseeker || isRecruiter) {
    return (
      <header
        className={`pointer-events-none sticky top-0 z-50 pt-3 transition-shadow duration-200 sm:pt-4 ${scrolled ? 'header-scrolled' : ''}`}
      >
        <div className="pointer-events-auto">
          <AuthenticatedHeader
            pathname={pathname}
            onLogout={handleLogout}
            hasUnreadBell={indicators.bell}
            isRecruiter={isRecruiter}
          />
        </div>
      </header>
    );
  }

  return (
    <header
      className={`pointer-events-none sticky top-0 z-50 pt-3 transition-shadow duration-200 sm:pt-4 ${scrolled ? 'header-scrolled' : ''}`}
    >
      <div className="pointer-events-auto">
        {!ready || !user ? (
          <div className="mx-auto mb-2 hidden max-w-7xl justify-end px-3 sm:flex sm:px-4">
            <HeaderFloat className="flex items-center gap-3 px-4 py-1.5 text-[11px] text-moons-muted">
              <Link href="/login" className="hover:text-moons-blue">
                Jobseeker Login
              </Link>
              <span className="text-border-subtle">|</span>
              <Link href="/login?role=recruiter" className="hover:text-moons-blue">
                Employer Login
              </Link>
              <span className="text-border-subtle">|</span>
              <Link href="/register" className="font-semibold text-moons-blue hover:underline">
                Register
              </Link>
            </HeaderFloat>
          </div>
        ) : null}

        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderFloat className="flex shrink-0 items-center px-2.5 py-1 sm:px-3 sm:py-1.5">
              <MoonsLogo size="md" priority />
            </HeaderFloat>

            <NavUniversalSearch
              floating
              stretched
              className="hidden min-w-0 flex-1 md:block"
            />

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
              <ThemeToggle />
              {ready && user ? (
                <>
                  <NotificationBell hasUnread={indicators.bell} />
                  <ProfileMenuButton onLogout={handleLogout} pathname={pathname} />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="header-float hidden px-5 py-3 text-[15px] font-medium text-foreground transition hover:text-moons-blue min-[400px]:inline-flex"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="header-float inline-flex items-center border-transparent bg-moons-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-moons-blue-dark sm:px-6 sm:text-[15px]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-2.5 md:hidden">
            <NavUniversalSearch floating stretched className="min-w-0 w-full" />
          </div>
        </div>
      </div>
    </header>
  );
}
