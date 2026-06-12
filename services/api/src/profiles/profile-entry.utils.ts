import type {
  CertificationEntryDto,
  EducationEntryDto,
  WorkExperienceEntryDto,
} from './dto/profile-entry.dto';

export function sanitizeEducations(items: EducationEntryDto[]) {
  return items.filter(
    (e) => e.degree?.trim() && e.institute?.trim() && e.year?.trim(),
  );
}

export function sanitizeWorkExperiences(items: WorkExperienceEntryDto[]) {
  return items.filter(
    (e) =>
      e.company?.trim() &&
      e.designation?.trim() &&
      e.startDate?.trim() &&
      (e.isCurrent || e.endDate?.trim()),
  );
}

export function sanitizeCertifications(items: CertificationEntryDto[]) {
  return items.filter((e) => e.name?.trim());
}
