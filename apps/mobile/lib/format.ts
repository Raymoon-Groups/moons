import { ApplicationStatus, EmploymentType } from '@moons/shared';

export function formatEmploymentType(type: string) {
  switch (type) {
    case EmploymentType.FULL_TIME:
      return 'Full-time';
    case EmploymentType.PART_TIME:
      return 'Part-time';
    case EmploymentType.CONTRACT:
      return 'Contract';
    case EmploymentType.INTERNSHIP:
      return 'Internship';
    case EmploymentType.REMOTE:
      return 'Remote';
    default:
      return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
}

export function formatRecruiterApplicationStatus(status: string) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return 'New';
    case ApplicationStatus.VIEWED:
      return 'Viewed';
    case ApplicationStatus.SHORTLISTED:
      return 'Shortlisted';
    case ApplicationStatus.REJECTED:
      return 'Rejected';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function formatApplicationStatus(status: string) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return 'Submitted';
    case ApplicationStatus.VIEWED:
      return 'Viewed';
    case ApplicationStatus.SHORTLISTED:
      return 'Shortlisted';
    case ApplicationStatus.REJECTED:
      return 'Rejected';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function formatPostedAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Longer “Posted …” label for job cards. */
export function formatPostedLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Posted just now';
  if (minutes < 60) return `Posted ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Posted 1 day ago';
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Posted 1 week ago' : `Posted ${weeks} weeks ago`;
  }
  return `Posted ${new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

/** Short experience band for job card tags (Junior / Middle / Senior). */
export function formatExperienceLevel(
  minExperienceYears?: number | null,
  maxExperienceYears?: number | null,
) {
  if (minExperienceYears == null && maxExperienceYears == null) return null;
  if (minExperienceYears === 0 && (maxExperienceYears == null || maxExperienceYears === 0)) {
    return 'Fresher';
  }
  const years = minExperienceYears ?? maxExperienceYears ?? 0;
  if (years <= 2) return 'Junior';
  if (years <= 5) return 'Middle';
  return 'Senior';
}
