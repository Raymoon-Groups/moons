import { apiFetch } from '@/lib/api';
import { searchProfessionals } from '@/lib/network';
import type { CompaniesPage, JobsPage } from '@/lib/types';

export type SearchSuggestionType = 'job' | 'company' | 'person' | 'skill';

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

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return getPopularSuggestions();

  const params = new URLSearchParams({ q, limit: '5' });
  const companyParams = new URLSearchParams({ q, limit: '4' });

  const [jobsResult, companiesResult, peopleResult] = await Promise.all([
    apiFetch<JobsPage>(`/jobs?${params}`).catch(() => null),
    apiFetch<CompaniesPage>(`/jobs/companies?${companyParams}`).catch(() => null),
    searchProfessionals({ q, limit: 5 }).catch(() => null),
  ]);

  const jobSuggestions: SearchSuggestion[] = (jobsResult?.items ?? []).slice(0, 4).map((job) => ({
    type: 'job',
    label: job.title,
    meta: [job.companyName, job.location].filter(Boolean).join(' · '),
    jobId: job.id,
  }));

  const companySuggestions: SearchSuggestion[] = (companiesResult?.items ?? [])
    .slice(0, 3)
    .map((company) => ({
      type: 'company',
      label: company.companyName,
      meta: company.industry ?? `${company.openJobs} open jobs`,
      recruiterId: company.recruiterId,
    }));

  const peopleSuggestions: SearchSuggestion[] = (peopleResult?.items ?? [])
    .slice(0, 4)
    .map((person) => ({
      type: 'person',
      label: person.fullName?.trim() || 'Professional',
      meta: person.headline || person.currentCompany || undefined,
      userId: person.userId,
    }));

  const skillSuggestions = matchSkillTerms(q, 3);

  const seen = new Set<string>();
  const combined = [
    ...peopleSuggestions,
    ...jobSuggestions,
    ...companySuggestions,
    ...skillSuggestions,
  ].filter((item) => {
    const key = `${item.type}:${item.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return combined.slice(0, 12);
}
