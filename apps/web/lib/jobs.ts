export interface JobListing {
  id: string;
  recruiterId?: string;
  title: string;
  companyName: string;
  postedByCompanyName?: string | null;
  description: string;
  location: string;
  employmentType: string;
  status: string;
  createdAt: string;
  salaryRange?: string | null;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  companyLogoUrl?: string | null;
  companyWebsite?: string | null;
  industry?: string | null;
  companyType?: string | null;
  companySize?: string | null;
  companyLocation?: string | null;
  officeAddress?: string | null;
  companySummary?: string | null;
}

export interface JobsPage {
  items: JobListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopCompany {
  recruiterId: string;
  companyName: string;
  openJobs: number;
  companyLogoUrl: string | null;
  industry: string | null;
  location: string | null;
}

export interface CompanyListing {
  recruiterId: string;
  companyName: string;
  openJobs: number;
  companyLogoUrl: string | null;
  industry: string | null;
  companyType: string | null;
  companySize: string | null;
  location: string | null;
  companyWebsite: string | null;
  companySummary: string | null;
  featuredJobs: Array<{ id: string; title: string; location: string }>;
}

export interface CompaniesPage {
  items: CompanyListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicCompanyProfile {
  recruiterId: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  industry: string | null;
  companyType: string | null;
  companySize: string | null;
  companyLocation: string | null;
  officeAddress: string | null;
  companySummary: string | null;
  openJobsCount: number;
  openJobs: Array<{
    id: string;
    title: string;
    location: string;
    employmentType: string;
    salaryRange: string | null;
    createdAt: string;
  }>;
}

export function formatJobExperience(job: Pick<JobListing, 'minExperienceYears' | 'maxExperienceYears'>) {
  const min = job.minExperienceYears;
  const max = job.maxExperienceYears;
  if (min == null && max == null) return null;
  if (min === 0 && (max === 0 || max == null)) return 'Fresher';
  if (min != null && max != null && min === max) {
    return min === 1 ? '1 year' : `${min} years`;
  }
  if (min != null && max != null) {
    return `${min}–${max} years`;
  }
  if (min != null) {
    return min === 1 ? 'Min. 1 year' : `Min. ${min} years`;
  }
  if (max != null) {
    return max === 1 ? 'Up to 1 year' : `Up to ${max} years`;
  }
  return null;
}

/** Longer label for job detail panels */
export function formatExperienceRequiredDetail(
  job: Pick<JobListing, 'minExperienceYears' | 'maxExperienceYears'>,
) {
  const min = job.minExperienceYears;
  const max = job.maxExperienceYears;
  if (min == null && max == null) return null;
  if (min === 0 && (max === 0 || max == null)) return 'Fresher (less than 1 year)';
  return formatJobExperience(job);
}

export function isPostedByOtherCompany(
  job: Pick<JobListing, 'companyName' | 'postedByCompanyName'>,
): boolean {
  const poster = job.postedByCompanyName?.trim();
  if (!poster) return false;
  return poster.toLowerCase() !== job.companyName.trim().toLowerCase();
}

export function getEmployerCompanyMeta(
  job: Pick<JobListing, 'industry' | 'companyType'>,
): string {
  return [job.industry, job.companyType].filter(Boolean).join(' · ');
}

export const SALARY_OPTIONS = [
  'Not disclosed',
  '0 - 3 LPA',
  '3 - 6 LPA',
  '6 - 10 LPA',
  '10 - 15 LPA',
  '15 - 25 LPA',
  '25 - 50 LPA',
  '50+ LPA',
];

export const JOB_EXPERIENCE_OPTIONS = [
  { label: 'Fresher', min: 0, max: 0 },
  { label: '1–3 years', min: 1, max: 3 },
  { label: '3–6 years', min: 3, max: 6 },
  { label: '6–10 years', min: 6, max: 10 },
  { label: '10+ years', min: 10, max: 31 },
];
