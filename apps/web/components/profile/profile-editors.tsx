'use client';

import { useState } from 'react';
import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@/lib/types';
import { Field, inputClass } from './profile-shared';

function emptyEducation(): EducationEntry {
  return { degree: '', institute: '', fieldOfStudy: '', year: '' };
}

function emptyWorkExperience(): WorkExperienceEntry {
  return {
    company: '',
    designation: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  };
}

function emptyCertification(): CertificationEntry {
  return { name: '', issuer: '', year: '' };
}

function EntryCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">{title}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function EducationListEditor({
  value,
  onChange,
}: {
  value: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
}) {
  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Education ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Degree" required>
              <input
                value={entry.degree}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, degree: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
                placeholder="B.Tech, MBA, B.Com…"
              />
            </Field>
            <Field label="Institute" required>
              <input
                value={entry.institute}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, institute: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Field of study">
              <input
                value={entry.fieldOfStudy ?? ''}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, fieldOfStudy: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
                placeholder="Computer Science, Finance…"
              />
            </Field>
            <Field label="Year of passing" required>
              <input
                value={entry.year}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, year: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
                placeholder="2022"
              />
            </Field>
          </div>
        </EntryCard>
      ))}
      {value.length < 10 && (
        <button
          type="button"
          onClick={() => onChange([...value, emptyEducation()])}
          className="rounded-full border border-dashed border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-surface-hover"
        >
          + Add education
        </button>
      )}
    </div>
  );
}

export function WorkExperienceListEditor({
  value,
  onChange,
}: {
  value: WorkExperienceEntry[];
  onChange: (next: WorkExperienceEntry[]) => void;
}) {
  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Employment ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company" required>
              <input
                value={entry.company}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, company: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Designation" required>
              <input
                value={entry.designation}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, designation: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Start date" required hint="YYYY-MM">
              <input
                type="month"
                value={entry.startDate}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, startDate: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="End date" hint="Leave empty if current">
              <input
                type="month"
                value={entry.endDate ?? ''}
                disabled={entry.isCurrent}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, endDate: e.target.value || null };
                  onChange(next);
                }}
                className={`${inputClass} disabled:bg-surface`}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-moons-silver sm:col-span-2">
              <input
                type="checkbox"
                checked={entry.isCurrent}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = {
                    ...entry,
                    isCurrent: e.target.checked,
                    endDate: e.target.checked ? null : entry.endDate,
                  };
                  onChange(next);
                }}
                className="rounded border-border"
              />
              I currently work here
            </label>
            <div className="sm:col-span-2">
              <Field label="Job description">
                <textarea
                  rows={3}
                  value={entry.description ?? ''}
                  onChange={(e) => {
                    const next = [...value];
                    next[index] = { ...entry, description: e.target.value };
                    onChange(next);
                  }}
                  className={`${inputClass} resize-y`}
                  placeholder="Key responsibilities and achievements…"
                />
              </Field>
            </div>
          </div>
        </EntryCard>
      ))}
      {value.length < 15 && (
        <button
          type="button"
          onClick={() => onChange([...value, emptyWorkExperience()])}
          className="rounded-full border border-dashed border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-surface-hover"
        >
          + Add employment
        </button>
      )}
    </div>
  );
}

export function CertificationListEditor({
  value,
  onChange,
}: {
  value: CertificationEntry[];
  onChange: (next: CertificationEntry[]) => void;
}) {
  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <EntryCard
          key={index}
          title={`Certification ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Certification name" required>
              <input
                value={entry.name}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, name: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Issuing organization">
              <input
                value={entry.issuer ?? ''}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, issuer: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Year">
              <input
                value={entry.year ?? ''}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = { ...entry, year: e.target.value };
                  onChange(next);
                }}
                className={inputClass}
                placeholder="2023"
              />
            </Field>
          </div>
        </EntryCard>
      ))}
      {value.length < 10 && (
        <button
          type="button"
          onClick={() => onChange([...value, emptyCertification()])}
          className="rounded-full border border-dashed border-moons-blue px-4 py-2 text-sm font-semibold text-moons-blue hover:bg-surface-hover"
        >
          + Add certification
        </button>
      )}
    </div>
  );
}

export function TagListEditor({
  label,
  placeholder,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const [input, setInput] = useState('');

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= max) return;
    onChange([...value, trimmed]);
    setInput('');
  }

  return (
    <div>
      <span className="text-sm font-medium text-moons-silver">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-moons-blue"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-moons-blue/60 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {value.length < max && (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag(input.replace(',', ''));
            }
          }}
          onBlur={() => addTag(input)}
          className={`${inputClass} mt-2`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
