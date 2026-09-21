'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, adminFetch, apiFetch } from '@/lib/api-client';
import { clearAdminPortalFlagCookie } from '@/lib/admin-portal';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/blogs', label: 'Blogs' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/reports', label: 'Reports' },
] as const;

type AdminMe =
  | { ok: true; mode: 'portal'; username: string }
  | { ok: true; mode: 'user'; email: string };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setChecking(true);
    authFetchAdminMe()
      .then((data) => {
        if (!active) return;
        setSession(data);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setSession(null);
        setError(err instanceof ApiError ? err.message : 'Admin session expired');
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [router, pathname]);

  async function handleLogout() {
    try {
      await apiFetch('/auth/admin/logout', { method: 'POST', skipAuthRetry: true });
    } catch {
      // still clear local state
    }
    clearAdminPortalFlagCookie();
    router.replace('/admin/login');
  }

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-moons-muted">
        Checking admin access…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Admin sign in required</h1>
        {error ? <p className="mt-3 text-sm text-moons-muted">{error}</p> : null}
        <Link
          href={`/admin/login?next=${encodeURIComponent(pathname)}`}
          className="mt-6 inline-block text-sm font-semibold text-moons-blue"
        >
          Go to admin login
        </Link>
      </div>
    );
  }

  const signedInAs =
    session.mode === 'portal' ? session.username : session.email ?? 'admin';

  return (
    <div className="li-page-bg min-h-screen">
      <div className="border-b border-border/70 bg-surface-elevated/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moons-blue">
              MoonsJob Admin
            </p>
            <h1 className="text-lg font-bold text-foreground">Content desk</h1>
            <p className="text-xs text-moons-muted">Signed in as {signedInAs}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {NAV.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-moons-blue text-white'
                        : 'bg-surface text-moons-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-moons-muted hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}

function authFetchAdminMe(): Promise<AdminMe> {
  return adminFetch<AdminMe>('/auth/admin/me');
}
