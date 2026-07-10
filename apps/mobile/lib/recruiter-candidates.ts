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

export const EXPERIENCE_BUCKETS = [
  { label: 'Any', value: '', min: undefined, max: undefined },
  { label: 'Fresher', value: '0', min: 0, max: 0 },
  { label: '1–3 yrs', value: '1-3', min: 1, max: 3 },
  { label: '4–6 yrs', value: '4-6', min: 4, max: 6 },
  { label: '7–10 yrs', value: '7-10', min: 7, max: 10 },
  { label: '10+ yrs', value: '10+', min: 11, max: 99 },
] as const;

export const NOTICE_OPTIONS = [
  'Immediately',
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months',
  'Serving Notice Period',
];
