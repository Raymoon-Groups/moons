import type { ApplicationStatus } from '@moons/shared';
import type { ApplicantRow } from '@/lib/types';

export interface RecruiterCandidateFilters {
  q?: string;
  jobId?: string;
  status?: ApplicationStatus;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  noticePeriod?: string;
  openToWork?: boolean;
  page?: number;
  limit?: number;
}

export type RecruiterCandidateRow = ApplicantRow & {
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
  };
};

/** Talent-pool row (all candidates) — no application/job required */
export type RecruiterTalentRow = {
  candidate: NonNullable<ApplicantRow['candidate']>;
};

export type RecruiterTalentPoolResponse = {
  items: RecruiterTalentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function buildRecruiterCandidatesUrl(filters: RecruiterCandidateFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.jobId) params.set('jobId', filters.jobId);
  if (filters.status) params.set('status', filters.status);
  if (filters.location?.trim()) params.set('location', filters.location.trim());
  if (filters.experienceMin != null) params.set('experienceMin', String(filters.experienceMin));
  if (filters.experienceMax != null) params.set('experienceMax', String(filters.experienceMax));
  if (filters.noticePeriod) params.set('noticePeriod', filters.noticePeriod);
  const qs = params.toString();
  return `/applications/recruiter/candidates${qs ? `?${qs}` : ''}`;
}

export function buildRecruiterTalentUrl(filters: RecruiterCandidateFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.location?.trim()) params.set('location', filters.location.trim());
  if (filters.experienceMin != null) params.set('experienceMin', String(filters.experienceMin));
  if (filters.experienceMax != null) params.set('experienceMax', String(filters.experienceMax));
  if (filters.noticePeriod) params.set('noticePeriod', filters.noticePeriod);
  if (filters.openToWork) params.set('openToWork', 'true');
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 50));
  return `/profiles/recruiter/talent?${params.toString()}`;
}
