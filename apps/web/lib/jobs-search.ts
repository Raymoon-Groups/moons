export type JobsSearchParams = {
  q?: string;
  location?: string;
  experience?: string;
  page?: number | string;
  job?: string | null;
};

export function buildJobsSearchUrl(params: JobsSearchParams = {}): string {
  const sp = new URLSearchParams();

  const q = params.q?.trim();
  const location = params.location?.trim();
  const experience = params.experience?.trim();

  if (q) sp.set('q', q);
  if (location) sp.set('location', location);
  if (experience) sp.set('experience', experience);

  const page = Number(params.page ?? 1);
  if (page > 1) sp.set('page', String(page));

  if (params.job) sp.set('job', params.job);

  const qs = sp.toString();
  return qs ? `/jobs?${qs}` : '/jobs';
}

export { EXPERIENCE_FILTER_OPTIONS } from './experience-options';
