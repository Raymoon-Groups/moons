import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@/lib/types';

export function sanitizeEducations(items: EducationEntry[]) {
  return items.filter(
    (e) => e.degree.trim() && e.institute.trim() && e.year.trim(),
  );
}

export function sanitizeWorkExperiences(items: WorkExperienceEntry[]) {
  return items.filter(
    (e) =>
      e.company.trim() &&
      e.designation.trim() &&
      e.startDate.trim() &&
      (e.isCurrent || (e.endDate?.trim() ?? false)),
  );
}

export function sanitizeCertifications(items: CertificationEntry[]) {
  return items.filter((e) => e.name.trim());
}
