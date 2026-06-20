'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl, resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { formatPostedAgo } from '@/lib/job-formatters';
import type { JobListing } from '@/lib/jobs';
import type { ApplicantRow, Profile } from '@/lib/types';

interface RecruiterStats {
  jobsCount: number;
  activeJobsCount: number;
  applicantsCount: number;
}

interface RecentApplicant extends ApplicantRow {
  jobTitle: string;
  jobId: string;
}

const HIRING_JOURNEY = [
  'Actively hiring',
  'Screening candidates',
  'Conducting interviews',
  'Extending offers',
  'Onboarding hires',
  'Paused hiring',
] as const;

const NAV_ITEMS = [
  { label: 'My home', href: '/dashboard', icon: HomeIcon },
  { label: 'My jobs', href: '/recruiter/jobs', icon: BriefcaseIcon },
  { label: 'Post a job', href: '/recruiter/jobs/new', icon: PlusIcon },
  { label: 'Company profile', href: '/profile', icon: BuildingIcon },
] as const;

function ProfileRing({
  percent,
  logoUrl,
  avatarUrl,
  name,
}: {
  percent: number;
  logoUrl: string | null;
  avatarUrl: string | null;
  name: string;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const image = logoUrl || avatarUrl;

  return (
    <div className="relative mx-auto h-[88px] w-[88px]">
      <svg viewBox="0 0 88 88" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-[6px] overflow-hidden rounded-full border-2 border-surface-elevated bg-surface shadow-sm">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
        {percent}%
      </span>
    </div>
  );
}

function JobScrollRow({ jobs }: { jobs: JobListing[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  }

  if (jobs.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute -right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-md hover:bg-surface"
        aria-label="Scroll jobs"
      >
        <svg className="h-4 w-4 text-heading" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {jobs.map((job) => {
          const logo = job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;
          const isActive = job.status === 'PUBLISHED';
          return (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="w-[220px] shrink-0 rounded-xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:border-moons-blue/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-sm font-bold text-moons-muted">
                  {logo ? (
                    <img src={logo} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    job.companyName.charAt(0)
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-moons-muted'
                  }`}
                >
                  {isActive ? 'Active' : job.status}
                </span>
              </div>
              <p className="mt-3 truncate text-sm font-bold text-heading">{job.title}</p>
              <p className="mt-0.5 truncate text-xs text-moons-muted">{job.location}</p>
              <p className="mt-2 text-[10px] text-moons-muted">Posted {formatPostedAgo(job.createdAt)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function loadRecentApplicants(jobs: JobListing[]): Promise<RecentApplicant[]> {
  const targets = jobs.filter((j) => j.status === 'PUBLISHED').slice(0, 3);
  if (targets.length === 0) return [];

  const batches = await Promise.all(
    targets.map(async (job) => {
      try {
        const applicants = await authFetch<ApplicantRow[]>(`/applications/job/${job.id}`);
        return applicants.map((a) => ({ ...a, jobTitle: job.title, jobId: job.id }));
      } catch {
        return [];
      }
    }),
  );

  return batches
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}

export function RecruiterDashboard() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [journey, setJourney] = useState<string | null>(null);

  useEffect(() => {
    authFetch<Profile>('/profiles/me').then(setProfile).catch(() => undefined);
    authFetch<RecruiterStats>('/jobs/mine/stats').then(setStats).catch(() => undefined);
    authFetch<JobListing[]>('/jobs/mine')
      .then(async (data) => {
        setJobs(data);
        const recent = await loadRecentApplicants(data);
        setRecentApplicants(recent);
      })
      .catch(() => setJobs([]));
  }, []);

  const companyName =
    profile?.currentCompany?.trim() ||
    user?.fullName?.trim() ||
    user?.email?.split('@')[0] ||
    'Company';
  const completion = profile?.completionPercent ?? 0;
  const logoSrc = resolveAssetUrl(profile?.companyLogoUrl);
  const avatarSrc = resolveAvatarUrl(user?.avatarUrl ?? profile?.avatarUrl, user?.avatarVersion);
  const industryLine = profile?.industry || profile?.companyType || 'Add industry';
  const locationLine = profile?.location || profile?.officeAddress || 'Add location';
  const lastUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const activeJobs = jobs.filter((j) => j.status === 'PUBLISHED');
  const displayJobs = activeTab === 'active' ? activeJobs : jobs;

  return (
    <div className="dash-page">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[248px_minmax(0,1fr)_272px] lg:items-start">
        {/* Left sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
            <ProfileRing
              percent={completion}
              logoUrl={logoSrc}
              avatarUrl={avatarSrc}
              name={companyName}
            />
            <h2 className="mt-4 text-center text-sm font-bold text-heading">{companyName}</h2>
            <p className="mt-1 text-center text-xs text-foreground/70">{industryLine}</p>
            <p className="mt-0.5 text-center text-xs text-foreground/70">{locationLine}</p>
            <p className="mt-2 text-center text-[10px] text-foreground/55">Last updated {lastUpdated}</p>
            {completion < 100 && (
              <Link
                href="/profile"
                className="mt-4 block w-full rounded-lg bg-moons-blue py-2.5 text-center text-sm font-semibold text-white hover:bg-moons-blue-dark"
              >
                Complete company profile
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-moons-blue/25 bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold text-heading">Hiring performance</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xl font-bold text-heading">{stats?.activeJobsCount ?? 0}</p>
                <p className="text-[10px] text-foreground/70">Active jobs</p>
              </div>
              <div>
                <p className="text-xl font-bold text-heading">{stats?.applicantsCount ?? 0}</p>
                <p className="text-[10px] text-foreground/70">Total applicants</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-moons-blue">
              <BoltIcon />
              {stats?.jobsCount ?? 0} jobs posted · {completion}% profile complete
            </p>
          </div>

          <nav className="rounded-xl border border-border bg-surface-elevated p-2 shadow-sm">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-moons-blue/10 text-moons-blue ring-1 ring-moons-blue/20'
                      : 'text-foreground/70 hover:bg-surface hover:text-foreground'
                  }`}
                >
                  <Icon active={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Center column */}
        <main className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-r from-moons-navy via-[#243b6b] to-[#1a3a6e] shadow-sm">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-amber-300">
                  PRO
                </div>
                <div>
                  <p className="text-lg font-bold text-white">MoonsJob PRO for Employers</p>
                  <p className="text-sm text-white/70">Hire faster with premium recruiting tools</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                Coming Soon
              </span>
            </div>
            <div className="border-t border-white/10 bg-black/10 px-6 py-4">
              <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> Featured job listings
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> AI candidate screening
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> Priority support
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-heading">Your posted jobs</h3>
              <Link href="/recruiter/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                View all
              </Link>
            </div>

            <div className="mt-4 flex gap-6 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`border-b-2 pb-2 text-sm font-semibold transition ${
                  activeTab === 'active'
                    ? 'border-moons-blue text-moons-blue'
                    : 'border-transparent text-moons-muted hover:text-foreground'
                }`}
              >
                Active ({activeJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`border-b-2 pb-2 text-sm font-semibold transition ${
                  activeTab === 'all'
                    ? 'border-moons-blue text-moons-blue'
                    : 'border-transparent text-moons-muted hover:text-foreground'
                }`}
              >
                All ({jobs.length})
              </button>
            </div>

            <div className="mt-4">
              {displayJobs.length === 0 ? (
                <p className="py-8 text-center text-sm text-moons-muted">
                  No jobs yet.{' '}
                  <Link href="/recruiter/jobs/new" className="text-moons-blue hover:underline">
                    Post your first job
                  </Link>
                </p>
              ) : (
                <JobScrollRow jobs={displayJobs} />
              )}
            </div>
          </div>

          {recentApplicants.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-heading">
                  <UsersIcon />
                  Recent applicants
                </h3>
                <Link href="/recruiter/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {recentApplicants.map((app) => {
                  const p = app.candidate.profile;
                  const name = p?.fullName?.trim() || app.candidate.email.split('@')[0];
                  const avatar = resolveAssetUrl(p?.avatarUrl);
                  return (
                    <Link
                      key={app.id}
                      href={`/recruiter/jobs/${app.jobId}/applicants`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-moons-blue/30 hover:bg-surface"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-bold text-moons-muted">
                        {avatar ? (
                          <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-heading">{name}</p>
                        <p className="truncate text-xs text-foreground/70">
                          Applied for {app.jobTitle}
                          {p?.location ? ` · ${p.location}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-moons-muted">
                        {app.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">Needs attention</p>
            <h3 className="mt-1 text-sm font-bold text-heading">Where are you in your hiring journey?</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {HIRING_JOURNEY.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setJourney(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    journey === option
                      ? 'border-moons-blue bg-moons-blue/10 text-moons-blue ring-1 ring-moons-blue/20'
                      : 'border-border bg-surface-elevated text-foreground/80 hover:border-moons-blue/40 hover:text-foreground'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm">
            <div className="h-32 bg-gradient-to-br from-moons-navy/20 via-surface to-moons-blue/10" />
            <div className="p-4">
              <h4 className="text-sm font-bold text-heading">Attract more quality candidates</h4>
              <p className="mt-1 text-xs leading-relaxed text-moons-muted">
                Complete your company profile with logo, industry, and summary to build trust with job seekers.
              </p>
              <Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-moons-blue hover:underline">
                Know more →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-sm text-moons-muted">Quick links</p>
            <div className="mt-3 space-y-2">
              <Link href="/recruiter/jobs/new" className="block text-sm font-medium text-moons-blue hover:underline">
                Post a new job
              </Link>
              <Link href="/recruiter/jobs" className="block text-sm font-medium text-moons-blue hover:underline">
                Manage jobs ({stats?.jobsCount ?? 0})
              </Link>
              <Link href="/profile" className="block text-sm font-medium text-moons-blue hover:underline">
                Company profile
              </Link>
              <Link href="/settings" className="block text-sm font-medium text-moons-blue hover:underline">
                Settings
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BriefcaseIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PlusIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function BuildingIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11.3 1.046a1 1 0 011.414 0l1.242 1.242a1 1 0 010 1.414l-2.829 2.829 1.414 1.414 2.829-2.829a3 3 0 000-4.242l-1.242-1.242a3 3 0 00-4.242 0L5.757 6.343a3 3 0 000 4.242l2.829 2.829 1.414-1.414-2.829-2.829a1 1 0 010-1.414l4.129-4.13z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
