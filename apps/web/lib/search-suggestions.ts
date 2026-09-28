import { apiFetch } from './api-client';
import { popularSearches, quickFilters } from './landing-data';
import type { CompaniesPage, JobListing, JobsPage } from './jobs';

export type SearchSuggestionType = 'job' | 'company' | 'skill';

export interface SearchSuggestion {
  type: SearchSuggestionType;
  label: string;
  meta?: string;
  href: string;
}

const STATIC_SKILL_TERMS = [
  ...popularSearches,
  ...quickFilters,
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'Java',
  'SQL',
  'AWS',
  'Product Management',
  'DevOps',
  'UI/UX',
  'Data analyst',
  'HR',
  'Sales',
];

const API_MAX_LIMIT = 50;
const JOB_SUGGESTION_MAX_PAGES = 20;

export function getPopularSuggestions(limit = 6): SearchSuggestion[] {
  return popularSearches.slice(0, limit).map((term) => ({
    type: 'skill' as const,
    label: term,
    href: `/jobs?q=${encodeURIComponent(term)}`,
  }));
}

function matchSkillTerms(query: string, limit = 3): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return STATIC_SKILL_TERMS.filter((term) => term.toLowerCase().includes(q))
    .slice(0, limit)
    .map((term) => ({
      type: 'skill' as const,
      label: term,
      href: `/jobs?q=${encodeURIComponent(term)}`,
    }));
}

async function fetchAllMatchingJobs(q: string): Promise<JobListing[]> {
  const allJobs: JobListing[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= JOB_SUGGESTION_MAX_PAGES) {
    const params = new URLSearchParams({
      q,
      limit: String(API_MAX_LIMIT),
      page: String(page),
    });
    const jobsResult = await apiFetch<JobsPage>(`/jobs?${params.toString()}`, {
      cache: false,
    }).catch(() => null);
    if (!jobsResult) break;
    allJobs.push(...(jobsResult.items ?? []));
    totalPages = Math.max(1, jobsResult.totalPages || 1);
    if ((jobsResult.items?.length ?? 0) === 0) break;
    page += 1;
  }

  return allJobs;
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (!q) return getPopularSuggestions();

  const companyParams = new URLSearchParams({ q, limit: '8' });

  const [jobs, companiesResult] = await Promise.all([
    fetchAllMatchingJobs(q),
    apiFetch<CompaniesPage>(`/jobs/companies?${companyParams.toString()}`, {
      cache: false,
    }).catch(() => null),
  ]);

  const jobSuggestions: SearchSuggestion[] = jobs.map((job) => ({
    type: 'job',
    label: job.title,
    meta: [job.companyName, job.location].filter(Boolean).join(' · ') || undefined,
    href: `/jobs?job=${job.id}&q=${encodeURIComponent(q)}`,
  }));

  const companySuggestions: SearchSuggestion[] = (companiesResult?.items ?? [])
    .slice(0, 6)
    .map((company) => ({
      type: 'company',
      label: company.companyName,
      meta: company.industry ?? `${company.openJobs} open jobs`,
      href: `/companies/${company.recruiterId}`,
    }));

  const skillSuggestions = matchSkillTerms(q, 3);

  const seen = new Set<string>();
  return [...jobSuggestions, ...companySuggestions, ...skillSuggestions].filter((item) => {
    const key = `${item.type}:${item.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
