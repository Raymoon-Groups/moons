import { apiFetch } from './api-client';
import { popularSearches, quickFilters } from './landing-data';
import type { CompaniesPage, JobsPage } from './jobs';

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

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return getPopularSuggestions();

  const params = new URLSearchParams({ q, limit: '5' });
  const companyParams = new URLSearchParams({ q, limit: '4' });

  const [jobsResult, companiesResult] = await Promise.all([
    apiFetch<JobsPage>(`/jobs?${params.toString()}`, { cache: false }).catch(() => null),
    apiFetch<CompaniesPage>(`/jobs/companies?${companyParams.toString()}`, {
      cache: false,
    }).catch(() => null),
  ]);

  const jobSuggestions: SearchSuggestion[] = (jobsResult?.items ?? [])
    .slice(0, 4)
    .map((job) => ({
      type: 'job',
      label: job.title,
      meta: job.companyName,
      href: `/jobs?job=${job.id}&q=${encodeURIComponent(q)}`,
    }));

  const companySuggestions: SearchSuggestion[] = (companiesResult?.items ?? [])
    .slice(0, 3)
    .map((company) => ({
      type: 'company',
      label: company.companyName,
      meta: company.industry ?? `${company.openJobs} open jobs`,
      href: `/companies/${company.recruiterId}`,
    }));

  const skillSuggestions = matchSkillTerms(q, 3);

  const seen = new Set<string>();
  const combined = [...jobSuggestions, ...companySuggestions, ...skillSuggestions].filter(
    (item) => {
      const key = `${item.type}:${item.label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
  );

  return combined.slice(0, 8);
}
