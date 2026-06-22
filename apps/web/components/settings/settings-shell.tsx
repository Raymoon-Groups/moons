'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashBackLink, DashPageHero } from '@/components/dash/dash-page-shell';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function ShieldIcon({ active }: { active?: boolean }) {
  return (
    <svg
      className={cx('h-4 w-4', active ? 'text-moons-blue' : 'text-moons-muted')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V7l8-4z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.7 1.7L15 9.9" />
    </svg>
  );
}

function UserCardIcon({ active }: { active?: boolean }) {
  return (
    <svg
      className={cx('h-4 w-4', active ? 'text-moons-blue' : 'text-moons-muted')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 21a6 6 0 0112 0"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5h2.5" />
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/settings/security',
    label: 'Security',
    description: 'Password, Google sign-in, and account access',
    icon: (active) => <ShieldIcon active={active} />,
  },
  {
    href: '/profile',
    label: 'Profile',
    description: 'Update your jobseeker or employer profile',
    icon: (active) => <UserCardIcon active={active} />,
  },
];

export function SettingsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <DashBackLink href="/dashboard">← Back to dashboard</DashBackLink>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="dash-sidebar-card">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-blue ring-1 ring-moons-blue/20">
                Settings
              </p>
              <p className="mt-3 text-sm text-moons-muted">
                Manage your account preferences, profile, and security.
              </p>
              <nav className="mt-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        'group block rounded-xl border px-4 py-3 transition',
                        active
                          ? 'border-moons-blue bg-moons-blue/10 ring-1 ring-moons-blue/20'
                          : 'border-border bg-surface hover:border-moons-blue/40 hover:bg-surface-hover',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{item.icon(active)}</div>
                        <div className="min-w-0">
                          <p
                            className={cx(
                              'text-sm font-semibold',
                              active ? 'text-moons-blue' : 'text-heading',
                            )}
                          >
                            {item.label}
                          </p>
                          <p
                            className={cx(
                              'mt-0.5 line-clamp-2 text-xs',
                              active ? 'text-foreground/80' : 'text-moons-muted',
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            <DashPageHero eyebrow="Account" title={title} subtitle={subtitle} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
