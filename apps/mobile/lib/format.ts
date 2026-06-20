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
