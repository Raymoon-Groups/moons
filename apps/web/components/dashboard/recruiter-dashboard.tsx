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
  { label: 'Overview', href: '/dashboard', icon: HomeIcon },
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
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="url(#moons-ring-recruiter)"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="moons-ring-recruiter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a7fd4" />
            <stop offset="100%" stopColor="#1a2744" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-[7px] overflow-hidden rounded-full border-2 border-surface-elevated bg-surface shadow-md ring-1 ring-moons-blue/15">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-blue to-moons-navy text-xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
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
        className="absolute -right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-md hover:bg-surface-hover"
        aria-label="Scroll jobs"
      >
        <svg className="h-4 w-4 text-heading" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          const isActive = job.status === 'PUBLISHED';
          return (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="group w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm transition hover:-translate-y-0.5 hover:border-moons-blue/30 hover:shadow-lg"
            >
              <div className="h-1 bg-gradient-to-r from-moons-blue to-moons-navy" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface text-sm font-bold text-moons-muted">
                    {logo ? (
                      <img src={logo} alt="" className="h-full w-full object-contain p-0.5" />
                    ) : (
                      job.companyName.charAt(0)
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isActive
                        ? 'bg-moons-blue/10 text-moons-blue'
                        : 'bg-surface text-moons-muted'
                    }`}
                  >
                    {isActive ? 'Active' : job.status}
                  </span>
                </div>
                <p className="mt-3 truncate text-sm font-bold text-heading group-hover:text-moons-blue">
                  {job.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-moons-muted">{job.companyName}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-moons-muted">
                  <PinIcon />
                  <span className="truncate">{job.location}</span>
                </p>
              </div>
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
    .slice(0, 3);
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
          <div className="dash-card overflow-hidden">
            <div className="bg-gradient-to-br from-moons-blue/10 via-surface-elevated to-moons-navy/5 px-5 pb-5 pt-6">
              <ProfileRing
                percent={completion}
                logoUrl={logoSrc}
                avatarUrl={avatarSrc}
                name={companyName}
              />
              <h2 className="mt-4 text-center text-base font-bold text-heading">{companyName}</h2>
              <p className="mt-1 text-center text-xs text-moons-muted">{industryLine}</p>
              <p className="mt-0.5 text-center text-xs text-moons-muted">{locationLine}</p>
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                    Profile complete
                  </p>
                  <p className="text-lg font-bold text-heading">{completion}%</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                    Applicants
                  </p>
                  <p className="text-lg font-bold text-heading">{stats?.applicantsCount ?? 0}</p>
                </div>
              </div>
              {completion < 100 && (
                <Link
                  href="/profile"
                  className="mt-4 block w-full rounded-xl bg-moons-navy py-2.5 text-center text-sm font-semibold text-white transition hover:bg-moons-blue"
                >
                  Finish company profile
                </Link>
              )}
              <p className="mt-3 text-center text-[10px] text-moons-muted">Updated {lastUpdated}</p>
            </div>
          </div>

          <nav className="dash-card p-2">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-gradient-to-r from-moons-blue/15 to-transparent text-heading'
                      : 'text-moons-muted hover:bg-surface hover:text-foreground'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active ? 'bg-moons-blue text-white' : 'bg-surface text-moons-muted'
                    }`}
                  >
                    <Icon active={active} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Center column */}
        <main className="min-w-0 space-y-5">
          <div className="relative dash-card overflow-hidden border-moons-blue/20">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-moons-blue/10"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-moons-blue to-moons-navy text-lg font-black text-white shadow-lg shadow-moons-blue/25">
                  ☽
                </div>
                <div>
                  <p className="font-script text-2xl text-moons-blue">Moons Plus</p>
                  <p className="text-sm text-moons-muted">Premium tools to hire faster and smarter</p>
                </div>
              </div>
              <span className="inline-flex w-fit rounded-full border border-moons-blue/25 bg-moons-blue/10 px-4 py-2 text-sm font-semibold text-heading">
                Coming soon
              </span>
            </div>
            <div className="border-t border-border bg-surface/50 px-6 py-3">
              <p className="text-xs text-moons-muted">
                Featured listings · AI screening · Priority support
              </p>
            </div>
          </div>

          <div className="dash-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-script text-xl text-moons-blue">For you</p>
                <h3 className="text-base font-bold text-heading">Your posted jobs</h3>
              </div>
              <Link href="/recruiter/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                See all
              </Link>
            </div>

            <div className="mt-4 inline-flex rounded-xl bg-surface p-1">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'active'
                    ? 'bg-surface-elevated text-heading shadow-sm ring-1 ring-border'
                    : 'text-moons-muted hover:text-foreground'
                }`}
              >
                Active ({activeJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-surface-elevated text-heading shadow-sm ring-1 ring-border'
                    : 'text-moons-muted hover:text-foreground'
                }`}
              >
                All jobs ({jobs.length})
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
            <div className="dash-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-script text-xl text-moons-blue">Recent</p>
                  <h3 className="text-base font-bold text-heading">
                    {recentApplicants.length} new applicant{recentApplicants.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <Link href="/recruiter/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
                  See all
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {recentApplicants.map((app, index) => {
                  const p = app.candidate.profile;
                  const name = p?.fullName?.trim() || app.candidate.email.split('@')[0];
                  const avatar = resolveAssetUrl(p?.avatarUrl);
                  return (
                    <Link
                      key={app.id}
                      href={`/recruiter/jobs/${app.jobId}/applicants`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-moons-blue/30 hover:bg-moons-blue/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-moons-blue/20 to-moons-navy/15 text-xs font-bold text-heading">
                        {avatar ? (
                          <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-heading">{name}</p>
                        <p className="truncate text-xs text-moons-muted">
                          {app.jobTitle}
                          {p?.location ? ` · ${p.location}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-moons-muted">{app.status}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="dash-card p-5">
            <p className="font-script text-xl text-moons-blue">Your status</p>
            <h3 className="mt-0.5 text-sm font-bold text-heading">Where are you in hiring?</h3>
            <div className="mt-4 space-y-2">
              {HIRING_JOURNEY.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setJourney(option)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                    journey === option
                      ? 'border-moons-blue bg-moons-blue/15 text-heading'
                      : 'border-border bg-surface text-foreground hover:border-moons-blue/30'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      journey === option ? 'bg-moons-blue' : 'bg-border'
                    }`}
                  />
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-card overflow-hidden border-moons-blue/20 bg-gradient-to-br from-moons-blue/15 via-surface-elevated to-surface-elevated">
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-blue">Tip</p>
              <h4 className="mt-1 text-sm font-bold text-heading">Attract more quality candidates</h4>
              <p className="mt-2 text-xs leading-relaxed text-moons-muted">
                Complete your company profile with logo, industry, and summary to build trust with
                job seekers.
              </p>
              <Link
                href="/profile"
                className="mt-4 inline-flex rounded-xl bg-moons-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue"
              >
                Improve profile
              </Link>
            </div>
          </div>

          <div className="dash-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">Shortcuts</p>
            <div className="mt-3 space-y-2">
              <Link
                href="/recruiter/jobs"
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                Manage jobs
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-moons-muted">
                  {stats?.jobsCount ?? 0}
                </span>
              </Link>
              <Link
                href="/recruiter/jobs/new"
                className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                Post a new job
              </Link>
              <Link
                href="/profile"
                className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                Company profile
              </Link>
              <Link
                href="/settings"
                className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
              >
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
    <svg className={`h-4 w-4 ${active ? 'text-white' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BriefcaseIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-white' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PlusIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-white' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function BuildingIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${active ? 'text-white' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
