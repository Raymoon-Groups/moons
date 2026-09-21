export type ExperienceSearchOption = {
  value: string;
  label: string;
  hint?: string;
};

/** Naukri-style job search experience: Fresher + 1–30 individual years */
export const EXPERIENCE_SEARCH_OPTIONS: ExperienceSearchOption[] = [
  { value: '0', label: 'Fresher', hint: '(less than 1 year)' },
  ...Array.from({ length: 30 }, (_, i) => {
    const years = i + 1;
    return {
      value: String(years),
      label: years === 1 ? '1 year' : `${years} years`,
    };
  }),
];

/** Recruiter job post / edit — experience required as ranges */
export const EXPERIENCE_REQUIRED_OPTIONS: ExperienceSearchOption[] = [
  { value: '0', label: 'Fresher', hint: '(less than 1 year)' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-6', label: '3–6 years' },
  { value: '6-10', label: '6–10 years' },
  { value: '10+', label: '10+ years' },
];

export const EXPERIENCE_FILTER_OPTIONS = EXPERIENCE_SEARCH_OPTIONS.map((opt) => ({
  label: opt.hint ? `${opt.label} ${opt.hint}` : opt.label,
  value: opt.value,
}));

const LEGACY_LABELS: Record<string, string> = {
  fresher: 'Fresher',
  '1-3': '1–3 years',
  '3-6': '3–6 years',
  '6-10': '6–10 years',
  '6+': '6+ years',
  '10+': '10+ years',
};

export function getExperienceSearchLabel(value: string | undefined | null): string {
  if (!value) return '';

  const normalized = normalizeExperienceValue(value);
  const required = EXPERIENCE_REQUIRED_OPTIONS.find((opt) => opt.value === normalized);
  if (required) {
    return required.hint ? `${required.label} ${required.hint}` : required.label;
  }

  const match = EXPERIENCE_SEARCH_OPTIONS.find((opt) => opt.value === normalized);
  if (match) {
    return match.hint ? `${match.label} ${match.hint}` : match.label;
  }

  return LEGACY_LABELS[value] ?? value;
}

export function getExperienceRequiredLabel(value: string | undefined | null): string {
  if (!value) return '';
  const normalized = normalizeExperienceRequiredValue(value);
  const match = EXPERIENCE_REQUIRED_OPTIONS.find((opt) => opt.value === normalized);
  if (match) {
    return match.hint ? `${match.label} ${match.hint}` : match.label;
  }
  return getExperienceSearchLabel(value);
}

/** Normalize job-search experience (single years). */
export function normalizeExperienceValue(value: string): string {
  switch (value) {
    case 'fresher':
    case 'Fresher':
      return '0';
    case '1-3':
    case '1–3 years':
      return '2';
    case '3-6':
    case '3–6 years':
      return '5';
    case '6+':
    case '6+ years':
    case '6-10':
    case '6–10 years':
      return '6';
    case '10+':
    case '10+ years':
      return '10';
    default:
      return value;
  }
}

/** Normalize recruiter “experience required” band values. */
export function normalizeExperienceRequiredValue(value: string): string {
  switch (value) {
    case 'fresher':
    case 'Fresher':
      return '0';
    case '1–3 years':
      return '1-3';
    case '3–6 years':
      return '3-6';
    case '6+':
    case '6+ years':
    case '6–10 years':
      return '6-10';
    case '10+ years':
      return '10+';
    default:
      // Map exact single-year picks from older posts into a band
      if (/^\d+$/.test(value)) {
        const years = Number.parseInt(value, 10);
        if (years === 0) return '0';
        if (years >= 1 && years <= 3) return '1-3';
        if (years >= 4 && years <= 6) return '3-6';
        if (years >= 7 && years <= 10) return '6-10';
        if (years > 10) return '10+';
      }
      return value;
  }
}

export function experienceValueToJobYears(value: string) {
  if (!value.trim()) {
    return { minExperienceYears: undefined, maxExperienceYears: undefined };
  }

  const band = normalizeExperienceRequiredValue(value);
  switch (band) {
    case '0':
      return { minExperienceYears: 0, maxExperienceYears: 0 };
    case '1-3':
      return { minExperienceYears: 1, maxExperienceYears: 3 };
    case '3-6':
      return { minExperienceYears: 3, maxExperienceYears: 6 };
    case '6-10':
      return { minExperienceYears: 6, maxExperienceYears: 10 };
    case '10+':
      return { minExperienceYears: 10, maxExperienceYears: undefined };
    default: {
      const years = Number.parseInt(band, 10);
      if (!Number.isFinite(years) || years < 0 || years > 30) {
        return { minExperienceYears: undefined, maxExperienceYears: undefined };
      }
      if (years === 0) {
        return { minExperienceYears: 0, maxExperienceYears: 0 };
      }
      return { minExperienceYears: years, maxExperienceYears: years };
    }
  }
}

export function jobYearsToExperienceValue(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return '';
  if (min === 0 && (max === 0 || max === 1 || max == null)) return '0';
  if (min === 1 && max === 3) return '1-3';
  if (min === 3 && max === 6) return '3-6';
  if (min === 6 && max === 10) return '6-10';
  if (min === 10 && (max == null || max >= 10)) return '10+';

  // Legacy exact year → nearest band
  if (min != null && max != null && min === max) {
    return normalizeExperienceRequiredValue(String(min));
  }
  if (min != null && max != null) {
    if (min <= 1 && max <= 3) return '1-3';
    if (min <= 3 && max <= 6) return '3-6';
    if (min <= 6 && max <= 10) return '6-10';
    if (min >= 10) return '10+';
  }
  if (min != null) return normalizeExperienceRequiredValue(String(min));
  if (max != null) return normalizeExperienceRequiredValue(String(max));
  return '';
}
