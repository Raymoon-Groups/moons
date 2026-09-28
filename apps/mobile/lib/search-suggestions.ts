import { rankJobsForQuery } from '@moons/shared';
import { apiFetch, authFetch } from '@/lib/api';
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

/** API DTO max is 50 — never request more per page. */
const API_MAX_LIMIT = 50;
/** Safety cap so a huge catalog can't hang the suggestion UI. */
const JOB_SUGGESTION_MAX_PAGES = 20;

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

async function fetchJobSuggestions(q: string): Promise<SearchSuggestion[]> {
  const trimmed = q.trim();
  const allJobs: JobListing[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= JOB_SUGGESTION_MAX_PAGES) {
    const params = new URLSearchParams({
      q: trimmed,
      limit: String(API_MAX_LIMIT),
      page: String(page),
    });
    const jobsResult = await authFetch<JobsPage>(`/jobs?${params}`).catch(() => null);
    if (!jobsResult) break;
    allJobs.push(...((jobsResult.items ?? []) as JobListing[]));
    totalPages = Math.max(1, jobsResult.totalPages || 1);
    if ((jobsResult.items?.length ?? 0) === 0) break;
    page += 1;
  }

  const ranked = rankJobsForQuery(allJobs, trimmed);
  return ranked.map((job) => ({
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
  if (!q) return getPopularSuggestions();

  if (scope === 'job') {
    // Return every matching job — the dropdown scrolls.
    const [jobs, skills] = await Promise.all([
      fetchJobSuggestions(q),
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
    fetchJobSuggestions(q).then((items) => items.slice(0, 12)),
    fetchCompanySuggestions(q, 6),
    fetchPeopleSuggestions(q, 8),
  ]);
  const skills = matchSkillTerms(q, 3);

  return dedupe([...jobs, ...people, ...companies, ...skills]).slice(0, 30);
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
