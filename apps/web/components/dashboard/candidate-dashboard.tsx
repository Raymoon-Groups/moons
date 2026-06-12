'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiFetch, authFetch } from '@/lib/api-client';
import { resolveAssetUrl, resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { formatPostedAgo } from '@/lib/job-formatters';
import type { JobListing } from '@/lib/jobs';
import type { Profile } from '@/lib/types';

interface CandidateStats {
  applicationsCount: number;
}

const JOURNEY_OPTIONS = [
  'Actively searching jobs',
  'Preparing for interviews',
  'Appearing for interviews',
  'Received an offer',
  'Joined a new company',
  'Not looking for jobs',
] as const;

const NAV_ITEMS = [
  { label: 'My home', href: '/dashboard', icon: HomeIcon },
  { label: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { label: 'Companies', href: '/jobs', icon: BuildingIcon },
  { label: 'Applications', href: '/applications', icon: FileIcon },
] as const;

function ProfileRing({
  percent,
  avatarUrl,
  name,
}: {
  percent: number;
  avatarUrl: string | null;
  name: string;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative mx-auto h-[88px] w-[88px]">
      <svg viewBox="0 0 88 88" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e8ecf2" strokeWidth="5" />
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
      <div className="absolute inset-[6px] overflow-hidden rounded-full border-2 border-white bg-surface shadow-sm">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-blue to-moons-blue-dark text-xl font-bold text-white">
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
        className="absolute -right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md hover:bg-surface"
        aria-label="Scroll jobs"
      >
        <svg className="h-4 w-4 text-moons-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {jobs.map((job) => {
          const logo = job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;
          return (
            <Link
              key={job.id}
              href={`/jobs?job=${job.id}`}
              className="w-[220px] shrink-0 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-moons-blue/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-sm font-bold text-moons-muted">
                  {logo ? (
                    <img src={logo} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    job.companyName.charAt(0)
                  )}
                </div>
                <span className="text-[10px] text-moons-muted">{formatPostedAgo(job.createdAt)}</span>
              </div>
              <p className="mt-3 truncate text-sm font-bold text-moons-navy">{job.title}</p>
              <p className="mt-0.5 truncate text-xs text-moons-muted">{job.companyName}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-moons-muted">
                <PinIcon />
                <span className="truncate">{job.location}</span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CandidateDashboard() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [trending, setTrending] = useState<JobListing[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [journey, setJourney] = useState<string | null>(null);

  useEffect(() => {
    authFetch<Profile>('/profiles/me').then(setProfile).catch(() => undefined);
    authFetch<CandidateStats>('/applications/mine/stats').then(setStats).catch(() => undefined);
    apiFetch<JobListing[]>('/jobs/trending').then(setTrending).catch(() => setTrending([]));
    apiFetch<{ items: JobListing[] } | JobListing[]>('/jobs?limit=12')
      .then((data) => {
        setJobs(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch(() => setJobs([]));
  }, []);

  const displayName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email?.split('@')[0] || 'User';
  const completion = profile?.completionPercent ?? 0;
  const avatarSrc = resolveAvatarUrl(user?.avatarUrl ?? profile?.avatarUrl, user?.avatarVersion);
  const education = profile?.educations?.[0];
  const educationLine = education
    ? `${education.degree}${education.institute ? ` · ${education.institute}` : ''}`
    : profile?.headline || 'Add your education';
  const locationLine = profile?.location || 'Add location';
  const lastUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const profileJobs = jobs;
  const preferenceCount = profile?.preferredRoles?.length ?? 0;
  const displayJobs = activeTab === 'profile' ? profileJobs : profileJobs.slice(0, 6);
  const earlyAccess = trending.length > 0 ? trending.slice(0, 3) : jobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[248px_minmax(0,1fr)_272px] lg:items-start">
        {/* Left sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <ProfileRing percent={completion} avatarUrl={avatarSrc} name={displayName} />
            <h2 className="mt-4 text-center text-sm font-bold text-moons-navy">{displayName}</h2>
            <p className="mt-1 text-center text-xs text-moons-muted">{educationLine}</p>
            <p className="mt-0.5 text-center text-xs text-moons-muted">{locationLine}</p>
            <p className="mt-2 text-center text-[10px] text-moons-muted">Last updated {lastUpdated}</p>
            {completion < 100 && (
              <Link href="/profile" className="mt-4 block w-full rounded-lg bg-moons-blue py-2.5 text-center text-sm font-semibold text-white hover:bg-moons-blue-dark">
                Complete profile
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-moons-blue/20 bg-blue-50/60 p-4 shadow-sm">
            <p className="text-xs font-semibold text-moons-navy">Profile performance</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xl font-bold text-moons-navy">{stats?.applicationsCount ?? 0}</p>
                <p className="text-[10px] text-moons-muted">Applications sent</p>
              </div>
              <div>
                <p className="text-xl font-bold text-moons-navy">{completion}%</p>
                <p className="text-[10px] text-moons-muted">Profile strength</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-moons-blue">
              <BoltIcon />
              Complete your profile to get more visibility
            </p>
          </div>

          <nav className="rounded-xl border border-border bg-white p-2 shadow-sm">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'bg-surface text-moons-navy' : 'text-moons-muted hover:bg-surface hover:text-foreground'
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
          {/* PRO — Coming Soon */}
          <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-r from-moons-navy via-[#243b6b] to-[#1a3a6e] shadow-sm">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-amber-300">
                  PRO
                </div>
                <div>
                  <p className="text-lg font-bold text-white">MoonsJob PRO</p>
                  <p className="text-sm text-white/70">Get hired faster with premium features</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  Coming Soon
                </span>
              </div>
            </div>
            <div className="border-t border-white/10 bg-black/10 px-6 py-4">
              <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> Hidden job invitations
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> AI-enhanced profile
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/40">○</span> Auto-apply on MoonsJob
                </p>
              </div>
            </div>
          </div>

          {/* Recommended jobs */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-moons-navy">Recommended jobs for you</h3>
              <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                View all
              </Link>
            </div>

            <div className="mt-4 flex gap-6 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`border-b-2 pb-2 text-sm font-semibold transition ${
                  activeTab === 'profile'
                    ? 'border-moons-blue text-moons-blue'
                    : 'border-transparent text-moons-muted hover:text-foreground'
                }`}
              >
                Profile ({profileJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`border-b-2 pb-2 text-sm font-semibold transition ${
                  activeTab === 'preferences'
                    ? 'border-moons-blue text-moons-blue'
                    : 'border-transparent text-moons-muted hover:text-foreground'
                }`}
              >
                Preferences ({preferenceCount})
              </button>
            </div>

            <div className="mt-4">
              {displayJobs.length === 0 ? (
                <p className="py-8 text-center text-sm text-moons-muted">
                  No jobs yet.{' '}
                  <Link href="/jobs" className="text-moons-blue hover:underline">Browse jobs</Link>
                </p>
              ) : (
                <JobScrollRow jobs={displayJobs} />
              )}
            </div>
          </div>

          {/* Early access */}
          {earlyAccess.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-moons-navy">
                  <MegaphoneIcon />
                  {earlyAccess.length} early access roles from top companies
                </h3>
                <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {earlyAccess.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs?job=${job.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-moons-blue/30 hover:bg-surface"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-moons-muted">
                      {job.companyName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-moons-navy">{job.title}</p>
                      <p className="truncate text-xs text-moons-muted">{job.companyName} · {job.location}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-moons-muted">{formatPostedAgo(job.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-violet-600">Needs attention</p>
            <h3 className="mt-1 text-sm font-bold text-moons-navy">
              Where are you in your job search journey?
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {JOURNEY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setJourney(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    journey === option
                      ? 'border-moons-blue bg-blue-50 text-moons-blue'
                      : 'border-border bg-white text-foreground hover:border-moons-blue/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="h-32 bg-gradient-to-br from-moons-blue/20 via-surface to-moons-navy/10" />
            <div className="p-4">
              <h4 className="text-sm font-bold text-moons-navy">
                Boost your profile visibility
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-moons-muted">
                A complete profile gets up to 3× more recruiter views. Add skills, resume, and work history.
              </p>
              <Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-moons-blue hover:underline">
                Know more →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-moons-muted">Quick links</span>
            </div>
            <div className="mt-3 space-y-2">
              <Link href="/applications" className="block text-sm font-medium text-moons-blue hover:underline">
                My applications ({stats?.applicationsCount ?? 0})
              </Link>
              <Link href="/profile" className="block text-sm font-medium text-moons-blue hover:underline">
                Edit profile
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

function BuildingIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function FileIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-moons-blue' : 'text-moons-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function PinIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg className="h-5 w-5 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}
