'use client';

const YEAR_CHOICES = Array.from({ length: 31 }, (_, years) => ({
  value: String(years),
  label: years === 0 ? 'Fresher (0)' : years === 1 ? '1 year' : `${years} years`,
}));

const selectClass =
  'mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30';

export function ExperienceRequiredPicker({
  minYears,
  maxYears,
  onChange,
  id,
}: {
  minYears: string;
  maxYears: string;
  onChange: (minYears: string, maxYears: string) => void;
  id?: string;
}) {
  function handleMin(next: string) {
    let max = maxYears;
    if (next && max && Number(next) > Number(max)) {
      max = next;
    }
    onChange(next, max);
  }

  function handleMax(next: string) {
    let min = minYears;
    if (next && min && Number(next) < Number(min)) {
      min = next;
    }
    onChange(min, next);
  }

  return (
    <div className="mt-1 grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={id ? `${id}-min` : undefined} className="block text-xs font-medium text-moons-muted">
          Min
        </label>
        <select
          id={id ? `${id}-min` : undefined}
          value={minYears}
          onChange={(e) => handleMin(e.target.value)}
          className={selectClass}
        >
          <option value="">Any</option>
          {YEAR_CHOICES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id ? `${id}-max` : undefined} className="block text-xs font-medium text-moons-muted">
          Max
        </label>
        <select
          id={id ? `${id}-max` : undefined}
          value={maxYears}
          onChange={(e) => handleMax(e.target.value)}
          className={selectClass}
        >
          <option value="">Any</option>
          {YEAR_CHOICES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Convert form min/max strings into API years. Empty = not specified. */
export function experienceRangeToJobYears(minYears: string, maxYears: string) {
  const min =
    minYears.trim() === '' ? undefined : Number.parseInt(minYears, 10);
  const max =
    maxYears.trim() === '' ? undefined : Number.parseInt(maxYears, 10);

  const minOk = min != null && Number.isFinite(min) && min >= 0 && min <= 30 ? min : undefined;
  const maxOk = max != null && Number.isFinite(max) && max >= 0 && max <= 30 ? max : undefined;

  if (minOk == null && maxOk == null) {
    return { minExperienceYears: undefined, maxExperienceYears: undefined };
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
