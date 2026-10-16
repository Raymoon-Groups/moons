'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiError, adminFetch } from '@/lib/api-client';

type ActivityItem = {
  id: string;
  email: string;
  role: 'CANDIDATE' | 'RECRUITER';
  method: 'PASSWORD' | 'GOOGLE';
  type: 'SIGNUP' | 'LOGIN';
  fullName: string | null;
  createdAt: string;
};

type Overview = {
  summary: {
    totalUsers: number;
    candidates: number;
    recruiters: number;
    signupsToday: number;
    loginsToday: number;
    signupsWeek: number;
    loginsWeek: number;
  };
  daily: Array<{ date: string; signups: number; logins: number }>;
  recentJoins: ActivityItem[];
  recentLogins: ActivityItem[];
};

const LINKS = [
  {
    href: '/admin/blogs',
    title: 'Blogs',
    desc: 'Create, edit, publish and delete blog posts.',
  },
  {
    href: '/admin/newsletter',
    title: 'Newsletter',
    desc: 'View emails collected from the website footer.',
  },
  {
    href: '/admin/announcements',
    title: 'Announcements',
    desc: 'Set the landing-page popup (shows for 5 seconds).',
  },
] as const;

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface-elevated p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-moons-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-moons-muted">{hint}</p> : null}
    </div>
  );
}

function ActivityList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: ActivityItem[];
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-moons-muted">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/60">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.fullName || item.email}
                </p>
                <p className="truncate text-xs text-moons-muted">
                  {item.email}
                  {' · '}
                  {item.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}
                  {' · '}
                  {item.method === 'GOOGLE' ? 'Google' : 'Email'}
                </p>
              </div>
              <time className="shrink-0 text-xs text-moons-muted">{formatWhen(item.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DailyBars({ daily }: { daily: Overview['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.signups + d.logins));
  return (
    <section className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm">
      <h2 className="text-lg font-bold text-foreground">Last 14 days</h2>
      <p className="mt-1 text-sm text-moons-muted">Joins vs logins by day</p>
      <div className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2">
        {daily.map((d) => {
          const joinH = (d.signups / max) * 100;
          const loginH = (d.logins / max) * 100;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center gap-0.5">
                <div
                  className="w-[45%] rounded-t bg-moons-blue/80"
                  style={{ height: `${Math.max(joinH, d.signups ? 4 : 0)}%` }}
                  title={`${d.signups} joins`}
                />
                <div
                  className="w-[45%] rounded-t bg-emerald-500/70"
                  style={{ height: `${Math.max(loginH, d.logins ? 4 : 0)}%` }}
                  title={`${d.logins} logins`}
                />
              </div>
              <span className="text-[10px] text-moons-muted">
                {d.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-moons-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-moons-blue/80" /> Joins
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> Logins
        </span>
      </div>
    </section>
  );
}

export default function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminFetch<Overview>('/analytics/admin/overview?days=14')
      .then((res) => {
        if (!active) return;
        setData(res);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Audience activity</h2>
          <p className="mt-1 text-sm text-moons-muted">
            Who joined and who logged in — without opening the database.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-moons-muted">Loading activity…</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Joined today" value={data.summary.signupsToday} />
              <StatCard label="Logged in today" value={data.summary.loginsToday} />
              <StatCard
                label="Joined this week"
                value={data.summary.signupsWeek}
              />
              <StatCard
                label="Logged in this week"
                value={data.summary.loginsWeek}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total users" value={data.summary.totalUsers} />
              <StatCard label="Candidates" value={data.summary.candidates} />
              <StatCard label="Recruiters" value={data.summary.recruiters} />
            </div>

            <DailyBars daily={data.daily} />

            <div className="grid gap-4 lg:grid-cols-2">
              <ActivityList
                title="Recent joins"
                empty="No new joins yet."
                items={data.recentJoins}
              />
              <ActivityList
                title="Recent logins"
                empty="No logins tracked yet. They appear after users sign in."
                items={data.recentLogins}
              />
            </div>
          </>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {LINKS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm transition hover:border-moons-blue/40"
            >
              <h2 className="text-lg font-bold text-foreground">{card.title}</h2>
              <p className="mt-2 text-sm text-moons-muted">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
