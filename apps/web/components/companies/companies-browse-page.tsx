'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANY_TYPE_OPTIONS, INDUSTRY_OPTIONS } from '@/components/profile/profile-constants';
import { resolveAssetUrl } from '@/lib/assets';
import { apiFetch } from '@/lib/api-client';
import type { CompanyListing, CompaniesPage } from '@/lib/jobs';

const CATEGORIES = [
  { id: 'all', label: 'All companies', subtitle: 'Browse every employer', match: () => true },
  { id: 'mnc', label: 'MNCs', subtitle: 'Multinational corps', match: (c: CompanyListing) => c.companyType === 'MNC' },
  { id: 'startup', label: 'Startups', subtitle: 'High-growth teams', match: (c: CompanyListing) => c.companyType === 'Startup' },
  { id: 'edtech', label: 'Edtech', subtitle: 'Education & learning', match: (c: CompanyListing) => c.industry?.toLowerCase().includes('edtech') ?? false },
  { id: 'healthcare', label: 'Healthcare', subtitle: 'Hospitals & health tech', match: (c: CompanyListing) => c.industry?.toLowerCase().includes('health') ?? false },
  { id: 'internet', label: 'Internet', subtitle: 'E-commerce & web', match: (c: CompanyListing) => c.industry?.toLowerCase().includes('internet') ?? false },
  { id: 'software', label: 'Software', subtitle: 'Product companies', match: (c: CompanyListing) => c.industry?.toLowerCase().includes('software') ?? false },
] as const;

type SortKey = 'jobs' | 'name';

function countLabel(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `${n}+`;
}

function CompanyRow({ company }: { company: CompanyListing }) {
  const logo = company.companyLogoUrl ? resolveAssetUrl(company.companyLogoUrl) : null;
  const summary =
    company.companySummary?.trim() ||
    `Hiring for ${company.openJobs} open role${company.openJobs === 1 ? '' : 's'}${company.location ? ` in ${company.location}` : ''}. Explore team culture, benefits, and active openings.`;

  return (
    <article className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-moons-blue/35 hover:shadow-md md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
          {logo ? (
            <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-xl font-bold text-moons-muted">{company.companyName.charAt(0)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/companies/${company.recruiterId}`}
                className="text-lg font-bold text-moons-navy hover:text-moons-blue md:text-xl"
              >
                {company.companyName}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-moons-muted md:text-sm">
                {company.companySize && <span>{company.companySize}</span>}
                {company.companySize && company.location && <span>·</span>}
                {company.location && (
                  <span className="inline-flex items-center gap-1">
                    <PinIcon />
                    {company.location}
                  </span>
                )}
                {company.companyWebsite && (
                  <>
                    <span>·</span>
                    <a
                      href={company.companyWebsite.startsWith('http') ? company.companyWebsite : `https://${company.companyWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-moons-blue hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Website
                    </a>
                  </>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <StarIcon />
              {company.openJobs} open role{company.openJobs === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {company.companyType && (
              <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-medium text-moons-muted">
                {company.companyType}
              </span>
            )}
            {company.industry && (
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-moons-blue">
                {company.industry}
              </span>
            )}
            {company.openJobs >= 3 && (
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                Actively hiring
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-moons-muted">{summary}</p>

          {(company.featuredJobs ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">Open roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(company.featuredJobs ?? []).map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs?job=${job.id}`}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-moons-blue/40 hover:text-moons-blue"
                  >
                    {job.title}
                    <span className="ml-1 text-moons-muted">· {job.location}</span>
                  </Link>
                ))}
                {company.openJobs > (company.featuredJobs ?? []).length && (
                  <Link
                    href={`/companies/${company.recruiterId}`}
                    className="rounded-lg border border-dashed border-moons-blue/40 px-3 py-1.5 text-xs font-medium text-moons-blue hover:bg-blue-50"
                  >
                    +{company.openJobs - (company.featuredJobs ?? []).length} more
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/companies/${company.recruiterId}`}
              className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark"
            >
              View company profile
            </Link>
            <Link
              href={`/jobs?q=${encodeURIComponent(company.companyName)}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-moons-navy hover:border-moons-blue/40 hover:bg-surface"
            >
              Browse all jobs
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CompaniesBrowsePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allCompanies, setAllCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [locationQ, setLocationQ] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('jobs');

  useEffect(() => {
    apiFetch<CompaniesPage>('/jobs/companies?limit=100')
      .then((data) => setAllCompanies(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalJobs = allCompanies.reduce((s, c) => s + c.openJobs, 0);
    const cities = new Set(allCompanies.map((c) => c.location).filter(Boolean));
    const industries = new Set(allCompanies.map((c) => c.industry).filter(Boolean));
    return { totalJobs, cities: cities.size, industries: industries.size };
  }, [allCompanies]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = allCompanies.filter(cat.match).length;
    }
    return counts;
  }, [allCompanies]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const type of COMPANY_TYPE_OPTIONS) {
      counts.set(type, allCompanies.filter((c) => c.companyType === type).length);
    }
    return counts;
  }, [allCompanies]);

  const industryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCompanies) {
      if (!c.industry) continue;
      counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [allCompanies]);

  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCompanies) {
      if (!c.location?.trim()) continue;
      const key = c.location.trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allCompanies]);

  const filtered = useMemo(() => {
    const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];
    const q = searchQ.trim().toLowerCase();
    const loc = locationQ.trim().toLowerCase() || locationFilter.toLowerCase();

    let list = allCompanies.filter((c) => {
      if (!category.match(c)) return false;
      if (selectedTypes.length > 0 && (!c.companyType || !selectedTypes.includes(c.companyType))) {
        return false;
      }
      if (selectedIndustries.length > 0 && (!c.industry || !selectedIndustries.includes(c.industry))) {
        return false;
      }
      if (q && !c.companyName.toLowerCase().includes(q) && !c.industry?.toLowerCase().includes(q)) {
        return false;
      }
      if (loc && !c.location?.toLowerCase().includes(loc)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.companyName.localeCompare(b.companyName);
      return b.openJobs - a.openJobs || a.companyName.localeCompare(b.companyName);
    });

    return list;
  }, [allCompanies, activeCategory, selectedTypes, selectedIndustries, searchQ, locationQ, locationFilter, sortBy]);

  const featured = useMemo(
    () => [...allCompanies].sort((a, b) => b.openJobs - a.openJobs).slice(0, 3),
    [allCompanies],
  );

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleIndustry(industry: string) {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry],
    );
  }

  function scrollCategories(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <section className="border-b border-border bg-gradient-to-br from-moons-navy via-[#243b6b] to-[#1a3a6e] px-4 py-10 md:py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Top companies hiring now</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">
            Research employers, compare cultures, and apply to roles at companies actively hiring across India.
          </p>

          {!loading && allCompanies.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              <StatPill label="Companies" value={String(allCompanies.length)} />
              <StatPill label="Open roles" value={String(stats.totalJobs)} />
              <StatPill label="Cities" value={String(stats.cities)} />
              <StatPill label="Industries" value={String(stats.industries)} />
            </div>
          )}

          <div className="mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-xl backdrop-blur sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <SearchIcon />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search company name or industry"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
              />
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <PinIcon />
              <input
                value={locationQ}
                onChange={(e) => setLocationQ(e.target.value)}
                placeholder="City or location"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
              />
            </div>
          </div>
        </div>
      </section>

      {!loading && featured.length > 0 && activeCategory === 'all' && !searchQ && !locationQ && (
        <section className="border-b border-border bg-white px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-sm font-bold text-moons-navy">Featured employers</h2>
            <p className="mt-1 text-xs text-moons-muted">Companies with the most active openings right now</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {featured.map((co) => (
                <Link
                  key={co.recruiterId}
                  href={`/companies/${co.recruiterId}`}
                  className="rounded-xl border border-border bg-surface p-4 transition hover:border-moons-blue/40 hover:shadow-sm"
                >
                  <p className="font-bold text-moons-navy">{co.companyName}</p>
                  <p className="mt-1 text-xs text-moons-muted">{co.industry || co.companyType || 'Employer'}</p>
                  <p className="mt-2 text-sm font-semibold text-moons-blue">{co.openJobs} open roles →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-border bg-white px-4 py-5">
        <div className="relative mx-auto max-w-7xl">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 md:px-10" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex min-w-[160px] shrink-0 flex-col rounded-xl border px-4 py-3 text-left transition md:min-w-[180px] ${
                    active ? 'border-moons-blue bg-blue-50 shadow-sm' : 'border-border bg-white hover:border-moons-blue/30'
                  }`}
                >
                  <span className="text-sm font-bold text-moons-navy">{cat.label}</span>
                  <span className="mt-0.5 text-xs text-moons-muted">{cat.subtitle}</span>
                  <span className="mt-2 text-xs font-semibold text-moons-blue">{countLabel(count)} Companies →</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-moons-navy">All filters</h2>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">Company type</p>
              <div className="mt-3 space-y-2">
                {COMPANY_TYPE_OPTIONS.filter((t) => (typeCounts.get(t) ?? 0) > 0).map((type) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="rounded border-border text-moons-blue focus:ring-moons-blue/30"
                    />
                    <span className="flex-1 text-foreground">{type}</span>
                    <span className="text-xs text-moons-muted">({typeCounts.get(type)})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">Industry</p>
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                {(industryCounts.length > 0
                  ? industryCounts
                  : INDUSTRY_OPTIONS.map((i) => [i, 0] as [string, number])
                )
                  .slice(0, 12)
                  .map(([industry, count]) => (
                    <label key={industry} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry)}
                        onChange={() => toggleIndustry(industry)}
                        className="rounded border-border text-moons-blue focus:ring-moons-blue/30"
                      />
                      <span className="flex-1 truncate text-foreground">{industry}</span>
                      {count > 0 && <span className="text-xs text-moons-muted">({count})</span>}
                    </label>
                  ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">Location</p>
              <div className="relative mt-3">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <input
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Search location"
                  className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/15"
                />
              </div>
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                {locationCounts.map(([loc, count]) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationFilter(loc)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition ${
                      locationFilter === loc ? 'bg-blue-50 text-moons-blue' : 'hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{loc}</span>
                    <span className="shrink-0 text-xs text-moons-muted">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {(selectedTypes.length > 0 || selectedIndustries.length > 0 || locationFilter || searchQ || locationQ) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedIndustries([]);
                  setLocationFilter('');
                  setSearchQ('');
                  setLocationQ('');
                  setActiveCategory('all');
                }}
                className="mt-5 w-full rounded-lg border border-border py-2 text-sm font-medium text-moons-muted hover:bg-surface"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-moons-blue/20 bg-blue-50/50 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-moons-navy">Why explore companies?</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-moons-muted">
              <li>· Compare culture, size, and industry before you apply</li>
              <li>· See all open roles from one employer in one place</li>
              <li>· Follow companies you like and check back for new jobs</li>
            </ul>
            <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline">
              Browse all jobs →
            </Link>
          </div>
        </aside>

        <main>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-moons-muted">
              Showing <span className="font-semibold text-moons-navy">{filtered.length}</span> companies
            </p>
            <label className="flex items-center gap-2 text-sm text-moons-muted">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground outline-none focus:border-moons-blue"
              >
                <option value="jobs">Most open roles</option>
                <option value="name">Company name (A–Z)</option>
              </select>
            </label>
          </div>

          {loading && (
            <p className="mt-6 rounded-2xl border border-border bg-white p-8 text-center text-sm text-moons-muted">
              Loading companies…
            </p>
          )}

          {error && (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-white p-8 text-center">
              <p className="text-sm text-moons-muted">No companies match your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedIndustries([]);
                  setLocationFilter('');
                  setSearchQ('');
                  setLocationQ('');
                  setActiveCategory('all');
                }}
                className="mt-3 text-sm font-semibold text-moons-blue hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {filtered.map((company) => (
              <CompanyRow key={company.recruiterId} company={company} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="ml-2 text-xs text-white/70">{label}</span>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 text-moons-muted ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="inline h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
