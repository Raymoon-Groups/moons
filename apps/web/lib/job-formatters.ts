import { EmploymentType } from '@moons/shared';
import type { JobListing } from '@/lib/jobs';
import { formatJobExperience } from '@/lib/jobs';

export function formatEmploymentType(type: string) {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPostedAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isRemoteJob(job: Pick<JobListing, 'location' | 'employmentType'>) {
  return (
    job.employmentType === EmploymentType.REMOTE ||
    /remote/i.test(job.location)
  );
}

export function experienceLevelLabel(job: Pick<JobListing, 'minExperienceYears' | 'maxExperienceYears'>) {
  const exp = formatJobExperience(job);
  if (!exp) return 'All levels';
  if (exp === 'Fresher') return 'Entry level';
  const min = job.minExperienceYears ?? 0;
  if (min >= 6) return 'Senior level';
  if (min >= 3) return 'Mid level';
  return 'Junior level';
}
