'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, authFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/blogs', label: 'Blogs' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/announcements', label: 'Announcements' },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    let active = true;
    setChecking(true);
    authFetch<{ ok: boolean }>('/auth/admin/me')
      .then(() => {
        if (active) {
          setAllowed(true);
          setError('');
        }
      })
      .catch((err) => {
        if (!active) return;
        setAllowed(false);
        setError(
          err instanceof ApiError
            ? err.message
            : 'You do not have admin access. Ask the developer to add your email to ADMIN_EMAILS.',
        );
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [ready, user, router, pathname]);

  if (!ready || checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-moons-muted">
        Checking admin access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
        <p className="mt-3 text-sm text-moons-muted">{error}</p>
        {user?.email && (
          <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-left text-sm text-foreground">
            Add this line to <code className="font-mono text-xs">services/api/.env</code>, then
            restart <code className="font-mono text-xs">pnpm dev</code>:
            <br />
            <code className="mt-2 block break-all font-mono text-xs text-moons-blue">
              ADMIN_EMAILS={user.email}
            </code>
          </p>
        )}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-moons-blue">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="li-page-bg min-h-screen">
      <div className="border-b border-border/70 bg-surface-elevated/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moons-blue">
              MoonsJob Admin
            </p>
            <h1 className="text-lg font-bold text-foreground">Content desk</h1>
          </div>
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
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
