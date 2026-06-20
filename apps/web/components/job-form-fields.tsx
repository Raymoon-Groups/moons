import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmploymentType } from '@moons/shared';
import { ExperienceRequiredPicker } from '@/components/jobs/experience-required-picker';
import {
  experienceValueToJobYears,
  jobYearsToExperienceValue,
} from '@/lib/experience-options';
import { SALARY_OPTIONS } from '@/lib/jobs';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30';

interface JobFormValues {
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  salaryRange: string;
  experienceBand: string;
}

interface Props {
  values: JobFormValues;
  onChange: <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => void;
  showProfileHint?: boolean;
  layout?: 'default' | 'sections';
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-bold text-heading">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function JobFormFields({ values, onChange, showProfileHint, layout = 'default' }: Props) {
  const titleField = (
    <div>
      <label className="block text-sm font-medium text-moons-silver">Job title *</label>
      <input
        required
        minLength={3}
        value={values.title}
        onChange={(e) => onChange('title', e.target.value)}
        className={inputClass}
      />
    </div>
  );

  const companyField = (
    <div>
      <label className="block text-sm font-medium text-moons-silver">Company name *</label>
      <input
        required
        value={values.companyName}
        onChange={(e) => onChange('companyName', e.target.value)}
        className={inputClass}
      />
      {showProfileHint && (
        <p className="mt-1 text-xs text-moons-muted">
          Pre-filled from your employer profile. Update in{' '}
          <Link href="/profile" className="text-moons-blue hover:underline">
            My profile
          </Link>
          .
        </p>
      )}
    </div>
  );

  const roleDetails = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-moons-silver">Location *</label>
        <input
          required
          value={values.location}
          onChange={(e) => onChange('location', e.target.value)}
          className={inputClass}
          placeholder="Bangalore · Hybrid"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-moons-silver">Employment type *</label>
        <select
          value={values.employmentType}
          onChange={(e) => onChange('employmentType', e.target.value as EmploymentType)}
          className={inputClass}
        >
          {Object.values(EmploymentType).map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-moons-silver">Salary range</label>
        <select
          value={values.salaryRange}
          onChange={(e) => onChange('salaryRange', e.target.value)}
          className={inputClass}
        >
          <option value="">Select salary (optional)</option>
          {SALARY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-moons-silver">Experience required</label>
        <ExperienceRequiredPicker
          value={values.experienceBand}
          onChange={(next) => onChange('experienceBand', next)}
          placeholder="Not specified"
        />
      </div>
    </div>
  );

  const descriptionField = (
    <div>
      <label className="block text-sm font-medium text-moons-silver">
        Description * (min 20 chars)
      </label>
      <textarea
        required
        minLength={20}
        rows={8}
        value={values.description}
        onChange={(e) => onChange('description', e.target.value)}
        className={inputClass}
        placeholder="Describe the role, responsibilities, and requirements…"
      />
    </div>
  );

  if (layout === 'sections') {
    return (
      <div className="space-y-8">
        <Section title="Basic information">
          {titleField}
          {companyField}
        </Section>
        <Section title="Role details">{roleDetails}</Section>
        <Section title="Job description">{descriptionField}</Section>
      </div>
    );
  }

  return (
    <>
      {titleField}
      {companyField}
      {roleDetails}
      {descriptionField}
    </>
  );
}

export function experienceBandToYears(band: string) {
  return experienceValueToJobYears(band);
}

export function yearsToExperienceBand(
  min: number | null | undefined,
  max: number | null | undefined,
) {
  return jobYearsToExperienceValue(min, max);
}

export type { JobFormValues };
