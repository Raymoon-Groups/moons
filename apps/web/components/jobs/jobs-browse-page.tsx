'use client';

import { EmploymentType } from '@moons/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { JobDetailPanel } from '@/components/jobs/job-detail-panel';
import { JobTags } from '@/components/jobs/job-tags';
import { apiFetch } from '@/lib/api-client';
import { formatPostedAgo } from '@/lib/job-formatters';
import { resolveAssetUrl } from '@/lib/assets';
import { SALARY_OPTIONS, type JobListing, type JobsPage } from '@/lib/jobs';

function normalizeJobsPage(data: JobsPage | JobListing[], page: number): JobsPage {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length || 20,
      totalPages: 1,
    };
  }
  return data;
}

async function fetchJobs(
  q: string,
  location: string,
  experience: string,
  page: number,
): Promise<JobsPage> {
  const base = new URLSearchParams();
  if (q) base.set('q', q);
  if (location) base.set('location', location);
  if (experience) base.set('experience', experience);

  const withPagination = new URLSearchParams(base);
  withPagination.set('page', String(page));
  withPagination.set('limit', '20');

  try {
    const result = await apiFetch<JobsPage>(`/jobs?${withPagination.toString()}`);
    return normalizeJobsPage(result, page);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (!message.includes('page should not exist')) {
      throw err;
    }
    const fallback = await apiFetch<JobListing[]>(
      `/jobs${base.toString() ? `?${base.toString()}` : ''}`,
    );
    return normalizeJobsPage(fallback, page);
  }
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative min-w-[130px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-8 text-xs font-medium text-foreground outline-none focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/15"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value || opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
    </div>
  );
}

function JobListCard({
  job,
  selected,
  onSelect,
}: {
  job: JobListing;
  selected: boolean;
  onSelect: () => void;
}) {
  const logoSrc = job.companyLogoUrl ? resolveAssetUrl(job.companyLogoUrl) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white p-4 text-left transition ${
        selected
          ? 'border-moons-blue shadow-md ring-1 ring-moons-blue/20'
          : 'border-border shadow-sm hover:border-moons-blue/40 hover:shadow'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-moons-muted">
              {job.companyName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-moons-navy">{job.title}</p>
          <p className="mt-0.5 text-sm text-moons-muted">{job.companyName}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-moons-muted">{formatPostedAgo(job.createdAt)}</p>

      <div className="mt-3">
        <JobTags job={job} />
      </div>
    </button>
  );
}

export function JobsBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const location = searchParams.get('location') ?? '';
  const experience = searchParams.get('experience') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const selectedJobId = searchParams.get('job') ?? '';

  const [searchQ, setSearchQ] = useState(q);
  const [searchLocation, setSearchLocation] = useState(location);
  const [data, setData] = useState<JobsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const [filterCompany, setFilterCompany] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterSalary, setFilterSalary] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');

  useEffect(() => {
    setSearchQ(q);
    setSearchLocation(location);
  }, [q, location]);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchJobs(q, location, experience, page);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load jobs');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [q, location, experience, page]);

  const jobs = data?.items ?? [];

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filterCompany && !job.companyName.toLowerCase().includes(filterCompany.toLowerCase())) {
        return false;
      }
      if (filterJobType && job.employmentType !== filterJobType) return false;
      if (filterSalary && job.salaryRange !== filterSalary) return false;
      if (filterIndustry && job.industry !== filterIndustry) return false;
      return true;
    });
  }, [jobs, filterCompany, filterJobType, filterSalary, filterIndustry]);

  const companyOptions = useMemo(() => {
    const names = [...new Set(jobs.map((j) => j.companyName))].sort();
    return names.map((name) => ({ label: name, value: name }));
  }, [jobs]);

  const industryOptions = useMemo(() => {
    const items = [...new Set(jobs.map((j) => j.industry).filter(Boolean))] as string[];
    return items.sort().map((name) => ({ label: name, value: name }));
  }, [jobs]);

  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    return `/jobs?${params.toString()}`;
  }

  function selectJob(id: string) {
    setMobileShowDetail(true);
    router.push(buildUrl({ job: id }), { scroll: false });
  }

  useEffect(() => {
    if (loading || filteredJobs.length === 0) return;
    const exists = filteredJobs.some((j) => j.id === selectedJobId);
    if (!selectedJobId || !exists) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('job', filteredJobs[0].id);
      router.replace(`/jobs?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to list/selection changes
  }, [loading, filteredJobs, selectedJobId]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    router.push(
      buildUrl({
        q: searchQ.trim() || null,
        location: searchLocation.trim() || null,
        page: null,
        job: null,
      }),
    );
  }

  function clearSearch() {
    setSearchQ('');
    setSearchLocation('');
    router.push('/jobs');
  }

  function pageHref(nextPage: number) {
    return buildUrl({ page: String(nextPage) });
  }

  const experienceOptions = [
    { label: 'Fresher', value: 'fresher' },
    { label: '1–3 years', value: '1-3' },
    { label: '3–6 years', value: '3-6' },
    { label: '6+ years', value: '6+' },
  ];

  const jobTypeOptions = Object.values(EmploymentType).map((t) => ({
    label: t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    value: t,
  }));

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      {/* Search hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2744] via-[#243b6b] to-[#1a3a6e] px-4 pb-16 pt-10 md:pb-20 md:pt-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Let&apos;s find your dream job
          </h1>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Discover the best opportunities at top companies across India.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative mx-auto mt-8 flex max-w-4xl flex-col gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-xl sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
            <SearchIcon />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Job title or keyword"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
            />
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
            <PinIcon />
            <input
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="City or remote"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
            />
          </div>
          <div className="flex items-center gap-2 px-1 pb-1 sm:pb-0">
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-2 text-sm font-medium text-moons-muted hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Filters */}
      <div className="border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <FilterSelect
            label="Experience Level"
            value={experience}
            onChange={(v) => router.push(buildUrl({ experience: v || null, page: null, job: null }))}
            options={experienceOptions}
          />
          <FilterSelect
            label="Company"
            value={filterCompany}
            onChange={setFilterCompany}
            options={companyOptions}
          />
          <FilterSelect
            label="Job types"
            value={filterJobType}
            onChange={setFilterJobType}
            options={jobTypeOptions}
          />
          <FilterSelect
            label="Salary"
            value={filterSalary}
            onChange={setFilterSalary}
            options={SALARY_OPTIONS.map((s) => ({ label: s, value: s }))}
          />
          <FilterSelect
            label="Industry"
            value={filterIndustry}
            onChange={setFilterIndustry}
            options={industryOptions}
          />
        </div>
      </div>

      {/* Split pane */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-moons-navy">
            Recommended jobs
            {data && (
              <span className="ml-1 font-normal text-moons-muted">
                ({data.total.toLocaleString()})
              </span>
            )}
          </p>
          <p className="text-xs text-moons-muted">Sort by: Last updated</p>
        </div>

        {loading && (
          <p className="rounded-xl border border-border bg-white p-8 text-center text-sm text-moons-muted">
            Loading jobs…
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <p className="rounded-xl border border-border bg-white p-8 text-center text-sm text-moons-muted">
            No jobs found. Try a different search or clear filters.
          </p>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid h-[calc(100vh-22rem)] min-h-[520px] gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
            {/* Job list */}
            <div
              className={`flex flex-col overflow-hidden rounded-xl border border-border bg-[#f0f3f8] ${
                mobileShowDetail ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="flex-1 space-y-3 overflow-y-auto p-1 pr-2">
                {filteredJobs.map((job) => (
                  <JobListCard
                    key={job.id}
                    job={job}
                    selected={job.id === selectedJobId}
                    onSelect={() => selectJob(job.id)}
                  />
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border bg-white px-3 py-2">
                  {page > 1 ? (
                    <button
                      type="button"
                      onClick={() => router.push(pageHref(page - 1))}
                      className="text-xs font-medium text-moons-blue hover:underline"
                    >
                      ← Previous
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-moons-muted">
                    Page {data.page} of {data.totalPages}
                  </span>
                  {page < data.totalPages ? (
                    <button
                      type="button"
                      onClick={() => router.push(pageHref(page + 1))}
                      className="text-xs font-medium text-moons-blue hover:underline"
                    >
                      Next →
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              )}
            </div>

            {/* Job detail */}
            <div
              className={`min-h-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm ${
                mobileShowDetail ? 'block h-full' : 'hidden h-full lg:block'
              }`}
            >
              <JobDetailPanel
                jobId={selectedJobId || null}
                showClose={mobileShowDetail}
                onClose={() => setMobileShowDetail(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={`h-3.5 w-3.5 text-moons-muted ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
