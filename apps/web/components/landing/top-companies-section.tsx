'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '@/lib/assets';
import { apiFetch } from '@/lib/api-client';
import type { TopCompany } from '@/lib/jobs';

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M3.5 17.5V6.5l6.5-3.5 6.5 3.5v11M7 17.5v-4h6v4M8 9h.01M12 9h.01M8 12h.01M12 12h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M10 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 17.5s5.5-3.75 5.5-8.25a5.5 5.5 0 10-11 0c0 4.5 5.5 8.25 5.5 8.25z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopCompanyCard({ company, featured }: { company: TopCompany; featured?: boolean }) {
  const logo = company.companyLogoUrl ? resolveAssetUrl(company.companyLogoUrl) : null;
  const initial = company.companyName.charAt(0).toUpperCase();
  const jobsLabel = `${company.openJobs} open job${company.openJobs === 1 ? '' : 's'}`;

  return (
    <Link
      href={`/companies/${company.recruiterId}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_4px_20px_rgba(26,39,68,0.05)] transition duration-300 hover:-translate-y-1 hover:border-moons-blue/30 hover:shadow-[0_12px_40px_rgba(74,127,212,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.22)]"
    >
      <div className="h-1 bg-gradient-to-r from-moons-navy via-moons-blue/70 to-transparent" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-moons-blue/12 to-moons-navy/8 text-xl font-bold text-moons-navy dark:text-heading">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-contain p-2" />
            ) : (
              initial
            )}
          </div>

          {featured && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-moons-navy/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-moons-navy ring-1 ring-moons-navy/15 dark:text-heading dark:ring-border/60">
              Top hire
            </span>
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-heading transition group-hover:text-moons-blue">
          {company.companyName}
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-moons-blue/10 px-2.5 py-1 text-[11px] font-semibold text-moons-blue ring-1 ring-moons-blue/20">
            {jobsLabel}
          </span>
          {company.industry?.trim() && (
            <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
              {company.industry.trim()}
            </span>
          )}
        </div>

        {company.location?.trim() && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-moons-muted">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            {company.location.trim()}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xs text-moons-muted">Explore company profile</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-moons-blue transition group-hover:gap-2">
            View roles
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated"
        >
          <div className="h-1 bg-moons-navy/20" />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="h-14 w-14 rounded-2xl bg-surface" />
            <div className="h-5 w-3/4 rounded bg-surface" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-surface" />
              <div className="h-6 w-24 rounded-full bg-surface" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopCompaniesSection() {
  const [companies, setCompanies] = useState<TopCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TopCompany[]>('/jobs/companies/top')
      .then((data) => setCompanies(data.slice(0, 8)))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && companies.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-surface-elevated via-surface to-moons-navy/[0.03] py-14 md:py-20">
      <div
        className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-moons-navy/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-moons-blue/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-moons-navy/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moons-navy ring-1 ring-moons-navy/15 dark:bg-surface dark:text-heading dark:ring-border/60">
              <BuildingIcon className="h-3.5 w-3.5" />
              Featured employers
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-heading md:text-3xl">
              Top companies hiring now
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-moons-muted md:text-base">
              Explore openings at leading employers on Moons — from fast-growing startups to established teams.
            </p>
          </div>
          <Link
            href="/companies"
            className="inline-flex shrink-0 items-center justify-center self-center rounded-full border border-border/80 bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-moons-blue shadow-sm transition hover:border-moons-blue/30 hover:bg-moons-blue/5 sm:self-auto"
          >
            Browse all companies
            <ArrowIcon className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 md:mt-10">
          {loading ? (
            <LoadingGrid />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((company, index) => (
                <TopCompanyCard key={company.recruiterId} company={company} featured={index < 3} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
