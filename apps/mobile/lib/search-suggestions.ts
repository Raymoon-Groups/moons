import { rankJobsForQuery } from '@moons/shared';
import { apiFetch } from '@/lib/api';
import { searchProfessionals } from '@/lib/network';
import type { CompaniesPage, JobListing, JobsPage } from '@/lib/types';

export type SearchSuggestionType = 'job' | 'company' | 'person' | 'skill';

export type SearchScope = 'all' | 'job' | 'person' | 'company';

export interface SearchSuggestion {
  type: SearchSuggestionType;
  label: string;
  meta?: string;
  jobId?: string;
  recruiterId?: string;
  userId?: string;
}

const POPULAR_SEARCHES = [
  'Software engineer',
  'Product manager',
  'Data analyst',
  'Marketing',
  'Sales',
  'HR',
  'Remote jobs',
  'Fresher',
];

const SKILL_TERMS = [
  ...POPULAR_SEARCHES,
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'Java',
  'SQL',
  'AWS',
  'DevOps',
  'UI/UX',
];

/** API DTO max is 50 — never request more. */
const API_MAX_LIMIT = 50;

export function getPopularSuggestions(limit = 6): SearchSuggestion[] {
  return POPULAR_SEARCHES.slice(0, limit).map((term) => ({
    type: 'skill' as const,
    label: term,
  }));
}

function matchSkillTerms(query: string, limit = 3): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return SKILL_TERMS.filter((term) => term.toLowerCase().includes(q))
    .slice(0, limit)
    .map((term) => ({
      type: 'skill' as const,
      label: term,
    }));
}

function dedupe(items: SearchSuggestion[]): SearchSuggestion[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Fetch up to `maxItems` published jobs (paged at API_MAX_LIMIT). */
export async function fetchPublishedJobsPool(
  opts: { q?: string; location?: string; experience?: string; maxItems?: number } = {},
): Promise<JobListing[]> {
  const maxItems = opts.maxItems ?? 200;
  const items: JobListing[] = [];
  let page = 1;
  let totalPages = 1;

  while (items.length < maxItems && page <= totalPages && page <= 10) {
    const params = new URLSearchParams({
      limit: String(API_MAX_LIMIT),
      page: String(page),
    });
    if (opts.q?.trim()) params.set('q', opts.q.trim());
    if (opts.location?.trim()) params.set('location', opts.location.trim());
    if (opts.experience) params.set('experience', opts.experience);

    const data = await apiFetch<JobsPage>(`/jobs?${params}`);
    items.push(...data.items);
    totalPages = Math.max(1, data.totalPages || 1);
    if (data.items.length === 0) break;
    page += 1;
  }

  return items.slice(0, maxItems);
}

async function fetchJobSuggestions(q: string, limit: number): Promise<SearchSuggestion[]> {
  const trimmed = q.trim();
  // Short acronyms: load a pool without relying on broken substring search,
  // then rank locally so "HR Recruiter" beats unrelated roles.
  let items: JobListing[];
  if (trimmed.length <= 3) {
    items = await fetchPublishedJobsPool({ maxItems: 150 }).catch(() => []);
  } else {
    const params = new URLSearchParams({
      q: trimmed,
      limit: String(Math.min(API_MAX_LIMIT, Math.max(limit, 20))),
    });
    const jobsResult = await apiFetch<JobsPage>(`/jobs?${params}`).catch(() => null);
    items = (jobsResult?.items ?? []) as JobListing[];
  }

  const ranked = rankJobsForQuery(items, trimmed);
  return ranked.slice(0, limit).map((job) => ({
    type: 'job' as const,
    label: job.title,
    meta: [job.companyName, job.location].filter(Boolean).join(' · '),
    jobId: job.id,
  }));
}

async function fetchCompanySuggestions(q: string, limit: number): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({
    q,
    limit: String(Math.min(limit, API_MAX_LIMIT)),
  });
  const companiesResult = await apiFetch<CompaniesPage>(`/jobs/companies?${params}`).catch(
    () => null,
  );
  return (companiesResult?.items ?? []).slice(0, limit).map((company) => ({
    type: 'company' as const,
    label: company.companyName,
    meta: company.industry ?? `${company.openJobs} open jobs`,
    recruiterId: company.recruiterId,
  }));
}

async function fetchPeopleSuggestions(q: string, limit: number): Promise<SearchSuggestion[]> {
  const peopleResult = await searchProfessionals({ q, limit }).catch(() => null);
  return (peopleResult?.items ?? []).slice(0, limit).map((person) => ({
    type: 'person' as const,
    label: person.fullName?.trim() || 'Professional',
    meta: person.headline || person.currentCompany || undefined,
    userId: person.userId,
  }));
}

/**
 * Fetch universal search suggestions, scoped so Jobs / People / Companies
 * each load a full list for that tab instead of a tiny shared slice.
 */
export async function fetchSearchSuggestions(
  query: string,
  scope: SearchScope = 'all',
): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return getPopularSuggestions();

  if (scope === 'job') {
    const [jobs, skills] = await Promise.all([
      fetchJobSuggestions(q, 20),
      Promise.resolve(matchSkillTerms(q, 4)),
    ]);
    const exactSkills = skills.filter((s) => s.label.toLowerCase() === q.toLowerCase());
    const otherSkills = skills.filter((s) => s.label.toLowerCase() !== q.toLowerCase());
    if (q.length <= 3) {
      return dedupe([...jobs, ...exactSkills, ...otherSkills]);
    }
    return dedupe([...exactSkills, ...jobs, ...otherSkills]);
  }

  if (scope === 'person') {
    return dedupe(await fetchPeopleSuggestions(q, 20));
  }

  if (scope === 'company') {
    return dedupe(await fetchCompanySuggestions(q, 20));
  }

  const [jobs, companies, people] = await Promise.all([
    fetchJobSuggestions(q, 8),
    fetchCompanySuggestions(q, 6),
    fetchPeopleSuggestions(q, 8),
  ]);
  const skills = matchSkillTerms(q, 3);

  return dedupe([...jobs, ...people, ...companies, ...skills]).slice(0, 24);
}

/** Client-side filter when a full “all” payload is already loaded. */
export function filterSuggestionsByScope(
  items: SearchSuggestion[],
  scope: SearchScope,
  opts?: { isPopular?: boolean },
): SearchSuggestion[] {
  if (scope === 'all') return items;

  if (opts?.isPopular) {
    if (scope === 'job') return items;
    return [];
  }

  if (scope === 'job') {
    return items.filter((item) => item.type === 'job' || item.type === 'skill');
  }
  return items.filter((item) => item.type === scope);
}
