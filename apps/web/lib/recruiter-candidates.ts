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
}

export type RecruiterCandidateRow = ApplicantRow & {
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
  };
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
