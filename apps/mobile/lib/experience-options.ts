export type ExperienceSearchOption = {
  value: string;
  label: string;
  hint?: string;
};

export const EXPERIENCE_SEARCH_OPTIONS: ExperienceSearchOption[] = [
  { value: '', label: 'Any experience' },
  { value: '0', label: 'Fresher', hint: '(less than 1 year)' },
  ...Array.from({ length: 15 }, (_, i) => {
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
