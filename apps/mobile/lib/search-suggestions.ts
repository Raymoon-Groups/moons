import { apiFetch } from '@/lib/api';
import { searchProfessionals } from '@/lib/network';
import type { CompaniesPage, JobsPage } from '@/lib/types';

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

async function fetchJobSuggestions(q: string, limit: number): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const jobsResult = await apiFetch<JobsPage>(`/jobs?${params}`).catch(() => null);
  return (jobsResult?.items ?? []).slice(0, limit).map((job) => ({
    type: 'job' as const,
    label: job.title,
    meta: [job.companyName, job.location].filter(Boolean).join(' · '),
    jobId: job.id,
  }));
}

async function fetchCompanySuggestions(q: string, limit: number): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
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
    return dedupe([...jobs, ...skills]);
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

  // Balanced “All” list: jobs, people, companies, keywords — not people-only at the top.
  return dedupe([...jobs, ...people, ...companies, ...skills]).slice(0, 24);
}

/** Client-side filter when a full “all” payload is already loaded. */
export function filterSuggestionsByScope(
  items: SearchSuggestion[],
  scope: SearchScope,
  opts?: { isPopular?: boolean },
): SearchSuggestion[] {
  if (scope === 'all') return items;

  // Popular list is keyword chips — keep them for All / Jobs only.
  if (opts?.isPopular) {
    if (scope === 'job') return items;
    return [];
  }

  if (scope === 'job') {
    return items.filter((item) => item.type === 'job' || item.type === 'skill');
  }
  return items.filter((item) => item.type === scope);
}
