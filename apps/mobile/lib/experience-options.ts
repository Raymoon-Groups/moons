export type ExperienceSearchOption = {
  value: string;
  label: string;
  hint?: string;
};

/** Naukri-style experience: Fresher + 1–30 years (matches web search filters). */
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

export const EXPERIENCE_SELECT_OPTIONS = [
  { label: 'Not specified', value: '' },
  ...EXPERIENCE_REQUIRED_OPTIONS.map((opt) => ({
    label: opt.hint ? `${opt.label} ${opt.hint}` : opt.label,
    value: opt.value,
  })),
];

/** Manual min/max year picks for recruiter job forms */
export const EXPERIENCE_YEAR_OPTIONS = [
  { label: 'Any', value: '' },
  ...Array.from({ length: 31 }, (_, years) => ({
    value: String(years),
    label: years === 0 ? 'Fresher (0)' : years === 1 ? '1 year' : `${years} years`,
  })),
];

export function experienceRangeToJobYears(minYears: string, maxYears: string) {
  const min = minYears.trim() === '' ? undefined : Number.parseInt(minYears, 10);
  const max = maxYears.trim() === '' ? undefined : Number.parseInt(maxYears, 10);
  const minOk = min != null && Number.isFinite(min) && min >= 0 && min <= 30 ? min : undefined;
  const maxOk = max != null && Number.isFinite(max) && max >= 0 && max <= 30 ? max : undefined;

  if (minOk == null && maxOk == null) {
    return {
      minExperienceYears: undefined as number | undefined,
      maxExperienceYears: undefined as number | undefined,
    };
  }
  if (minOk != null && maxOk != null && minOk > maxOk) {
    return { minExperienceYears: maxOk, maxExperienceYears: minOk };
  }
  return { minExperienceYears: minOk, maxExperienceYears: maxOk };
}

export function jobYearsToExperienceRange(
  min: number | null | undefined,
  max: number | null | undefined,
): { minYears: string; maxYears: string } {
  return {
    minYears: min == null ? '' : String(min),
    maxYears: max == null ? '' : String(max),
  };
}

/** Jobs browse filter chips / sheet (includes “Any”). */
export const EXPERIENCE_FILTER_OPTIONS = [
  { label: 'Any experience', value: '' },
  ...EXPERIENCE_SEARCH_OPTIONS.map((opt) => ({
    label: opt.hint ? `${opt.label} ${opt.hint}` : opt.label,
    value: opt.value,
  })),
];

export function getExperienceSearchLabel(value: string | undefined | null): string {
  if (!value) return '';
  const required = EXPERIENCE_REQUIRED_OPTIONS.find(
    (opt) => opt.value === normalizeExperienceRequiredValue(value),
  );
  if (required) {
    return required.hint ? `${required.label} ${required.hint}` : required.label;
  }
  const normalized = normalizeExperienceValue(value);
  const match = EXPERIENCE_SEARCH_OPTIONS.find((opt) => opt.value === normalized);
  if (match) {
    return match.hint ? `${match.label} ${match.hint}` : match.label;
  }
  return value;
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
    return {
      minExperienceYears: undefined as number | undefined,
      maxExperienceYears: undefined as number | undefined,
    };
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
