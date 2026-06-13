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

export const EXPERIENCE_FILTER_OPTIONS = EXPERIENCE_SEARCH_OPTIONS.map((opt) => ({
  label: opt.hint ? `${opt.label} ${opt.hint}` : opt.label,
  value: opt.value,
}));

const LEGACY_LABELS: Record<string, string> = {
  fresher: 'Fresher',
  '1-3': '1–3 years',
  '3-6': '3–6 years',
  '6+': '6+ years',
};

export function getExperienceSearchLabel(value: string | undefined | null): string {
  if (!value) return '';

  const normalized = normalizeExperienceValue(value);
  const match = EXPERIENCE_SEARCH_OPTIONS.find((opt) => opt.value === normalized);
  if (match) {
    return match.hint ? `${match.label} ${match.hint}` : match.label;
  }

  return LEGACY_LABELS[value] ?? value;
}

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
    case '6–10 years':
      return '6';
    case '10+ years':
      return '10';
    default:
      return value;
  }
}

export function experienceValueToJobYears(value: string) {
  if (!value.trim()) {
    return { minExperienceYears: undefined, maxExperienceYears: undefined };
  }

  const normalized = normalizeExperienceValue(value);
  const years = Number.parseInt(normalized, 10);
  if (!Number.isFinite(years) || years < 0 || years > 30) {
    return { minExperienceYears: undefined, maxExperienceYears: undefined };
  }

  if (years === 0) {
    return { minExperienceYears: 0, maxExperienceYears: 0 };
  }

  return { minExperienceYears: years, maxExperienceYears: years };
}

export function jobYearsToExperienceValue(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return '';
  if (min === 0 && (max === 0 || max === 1 || max == null)) return '0';
  if (min != null && max != null && min === max) return String(min);
  if (min != null) return String(min);
  if (max != null) return String(max);
  return '';
}
