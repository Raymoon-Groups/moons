'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DashBackLink,
  DashContentCard,
  DashEmptyState,
  DashErrorCard,
  DashLoadingPage,
  DashPageHero,
  DashPageLayout,
  DashQuickLinks,
  DashSidebarPanel,
  DashTipsList,
} from '@/components/dash/dash-page-shell';
import { apiFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { formatEmploymentType } from '@/lib/job-formatters';
import type { PublicCompanyProfile } from '@/lib/jobs';

function CompanyLogo({ company }: { company: PublicCompanyProfile }) {
  const name = company.companyName?.trim() || 'Company';
  const logo = company.companyLogoUrl ? resolveAssetUrl(company.companyLogoUrl) : null;

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-sm ring-2 ring-moons-blue/10 sm:h-24 sm:w-24">
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-contain p-2" />
      ) : (
        <span className="text-2xl font-bold text-moons-blue sm:text-3xl">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function OpenJobCard({ job }: { job: PublicCompanyProfile['openJobs'][number] }) {
  const typeLabel = formatEmploymentType(job.employmentType);
  const meta = [job.location, job.salaryRange].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/jobs?job=${job.id}`}
      className="group block rounded-xl border border-border/80 bg-surface p-4 transition hover:border-moons-blue/35 hover:bg-surface-hover hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-heading transition group-hover:text-moons-blue">
            {job.title}
          </p>
          {meta ? <p className="mt-1.5 text-sm text-moons-muted">{meta}</p> : null}
        </div>
        <span className="shrink-0 rounded-full border border-moons-blue/20 bg-moons-blue/10 px-3 py-1 text-xs font-semibold text-moons-blue">
          {typeLabel}
        </span>
      </div>
    </Link>
  );
}

export function CompanyDetailPage({ recruiterId }: { recruiterId: string }) {
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch<PublicCompanyProfile>(`/profiles/companies/${recruiterId}`)
      .then(setCompany)
      .catch((err) => setError(err instanceof Error ? err.message : 'Company not found'))
      .finally(() => setLoading(false));
  }, [recruiterId]);

  if (loading) return <DashLoadingPage message="Loading company profile…" />;

  if (error || !company) {
    return (
      <DashErrorCard message={error || 'Company not found'} backHref="/companies" backLabel="← Back to companies" />
    );
  }

  const name = company.companyName?.trim() || 'Company';
  const subtitle = [company.industry, company.companyType].filter(Boolean).join(' · ');
  const hasAbout =
    company.companySummary ||
    company.companySize ||
    company.companyLocation ||
    company.officeAddress;

  const websiteHref = company.companyWebsite
    ? company.companyWebsite.startsWith('http')
      ? company.companyWebsite
      : `https://${company.companyWebsite}`
    : null;

  return (
    <DashPageLayout
      maxWidth="max-w-5xl"
      backLink={<DashBackLink href="/companies">← Back to companies</DashBackLink>}
      sidebar={
        <>
          <DashSidebarPanel title="Quick actions">
            <DashQuickLinks
              links={[
                {
                  href: `/jobs?q=${encodeURIComponent(name)}`,
                  label: 'Browse all jobs',
                  primary: true,
                },
                { href: '/companies', label: 'More companies' },
                { href: '/jobs', label: 'Explore jobs' },
              ]}
            />
          </DashSidebarPanel>

          {websiteHref ? (
            <DashSidebarPanel title="Website">
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-moons-blue hover:underline"
              >
                <GlobeIcon />
                Visit company site
              </a>
            </DashSidebarPanel>
          ) : null}

          <DashTipsList
            items={[
              'Review open roles that match your skills and experience.',
              'Research the company culture and office location before applying.',
              'Follow up on applications from your Applications dashboard.',
            ]}
          />
        </>
      }
    >
      <DashPageHero
        eyebrow="Employer profile"
        eyebrowIcon={<BuildingIcon />}
        title={name}
        subtitle={subtitle || `${company.openJobsCount} open role${company.openJobsCount === 1 ? '' : 's'}`}
        action={<CompanyLogo company={company} />}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          {company.companyType ? (
            <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-medium text-moons-muted ring-1 ring-border">
              {company.companyType}
            </span>
          ) : null}
          {company.industry ? (
            <span className="rounded-md bg-moons-blue/10 px-2.5 py-1 text-[11px] font-medium text-moons-blue ring-1 ring-moons-blue/20">
              {company.industry}
            </span>
          ) : null}
          {company.openJobsCount >= 3 ? (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
              Actively hiring
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <StatChip icon={<BriefcaseIcon />} value={String(company.openJobsCount)} label="Open jobs" />
          {company.companySize ? (
            <StatChip icon={<UsersIcon />} value={company.companySize} label="Team size" />
          ) : null}
          {company.companyLocation ? (
            <StatChip icon={<PinIcon />} value={company.companyLocation} label="Head office" />
          ) : null}
        </div>
      </DashPageHero>

      {hasAbout ? (
        <DashContentCard title="About the company">
          {company.companySummary ? (
            <p className="text-sm leading-relaxed text-foreground">{company.companySummary}</p>
          ) : null}

          <div className={`grid gap-3 sm:grid-cols-2 ${company.companySummary ? 'mt-5' : ''}`}>
            <DetailTile label="Company size" value={company.companySize} />
            <DetailTile label="Head office city" value={company.companyLocation} />
            <div className="sm:col-span-2">
              <DetailTile label="Office address" value={company.officeAddress} />
            </div>
          </div>

          {websiteHref ? (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-moons-blue/25 bg-moons-blue/10 px-4 py-2.5 text-sm font-semibold text-moons-blue transition hover:bg-moons-blue/15"
            >
              <GlobeIcon />
              Visit website
            </a>
          ) : null}
        </DashContentCard>
      ) : null}

      <DashContentCard title={`Open positions (${company.openJobsCount})`}>
        {company.openJobs.length === 0 ? (
          <DashEmptyState
            icon={<BriefcaseIcon className="h-7 w-7 text-moons-blue" />}
            title="No open roles right now"
            description="This company isn't actively listing jobs at the moment. Check back later or explore other employers."
            action={
              <Link
                href="/companies"
                className="inline-flex rounded-xl bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
              >
                Browse companies
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {company.openJobs.map((job) => (
              <OpenJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </DashContentCard>
    </DashPageLayout>
  );
}

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-elevated px-3 py-2 shadow-sm">
      <span className="text-moons-blue">{icon}</span>
      <div>
        <p className="text-sm font-bold text-heading">{value}</p>
        <p className="text-[11px] font-medium text-moons-muted">{label}</p>
      </div>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}
