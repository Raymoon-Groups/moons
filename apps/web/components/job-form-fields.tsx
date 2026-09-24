'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  EmploymentType,
  WorkMode,
  ScreeningQuestionType,
  type ScreeningQuestion,
} from '@moons/shared';
import {
  ExperienceRequiredPicker,
  experienceRangeToJobYears,
  jobYearsToExperienceRange,
} from '@/components/jobs/experience-required-picker';
import { RichTextEditor } from '@/components/rich-text-editor';
import { SALARY_OPTIONS } from '@/lib/jobs';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30';

interface JobFormValues {
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salaryRange: string;
  minExperienceYears: string;
  maxExperienceYears: string;
  screeningQuestions: ScreeningQuestion[];
}

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: WorkMode.ONSITE, label: 'On-site' },
  { value: WorkMode.REMOTE, label: 'Remote' },
  { value: WorkMode.HYBRID, label: 'Hybrid' },
  { value: WorkMode.WORK_FROM_HOME, label: 'Work from home' },
];

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

function newQuestionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createQuestion(
  type: ScreeningQuestionType,
  prompt: string,
  sortOrder: number,
): ScreeningQuestion {
  return {
    id: newQuestionId(),
    prompt,
    type,
    required: true,
    options:
      type === ScreeningQuestionType.SINGLE_CHOICE
        ? ['Immediate', '15 days', '30 days', '60+ days']
        : undefined,
    sortOrder,
  };
}

const QUESTION_TYPE_LABELS: Record<ScreeningQuestionType, string> = {
  [ScreeningQuestionType.TEXT]: 'Short text',
  [ScreeningQuestionType.YES_NO]: 'Yes / No',
  [ScreeningQuestionType.SINGLE_CHOICE]: 'Multiple choice',
  [ScreeningQuestionType.RESUME]: 'CV upload',
};

function ChoiceOptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const rows = options.length > 0 ? options : ['', ''];

  function setOption(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function addOption() {
    if (rows.length >= 10) return;
    onChange([...rows, '']);
  }

  function removeOption(index: number) {
    if (rows.length <= 2) {
      const next = [...rows];
      next[index] = '';
      onChange(next);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-moons-silver">Answer choices *</label>
        <span className="text-[11px] text-moons-muted">{rows.length}/10</span>
      </div>
      <ul className="space-y-2">
        {rows.map((option, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-moons-muted ring-1 ring-border/70">
              {String.fromCharCode(65 + index)}
            </span>
            <input
              value={option}
              onChange={(e) => setOption(index, e.target.value)}
              className={`${inputClass} mt-0`}
              placeholder={`Choice ${index + 1}`}
              maxLength={100}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="shrink-0 rounded-full px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              aria-label={`Remove choice ${index + 1}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={rows.length >= 10}
        onClick={addOption}
        className="text-xs font-semibold text-moons-blue transition hover:underline disabled:opacity-50"
      >
        + Add choice
      </button>
      <p className="text-[11px] text-moons-muted">At least 2 non-empty choices are required.</p>
    </div>
  );
}

export function JobFormFields({ values, onChange, showProfileHint, layout = 'default' }: Props) {
  const questions = values.screeningQuestions ?? [];

  function updateQuestions(next: ScreeningQuestion[]) {
    onChange(
      'screeningQuestions',
      next.map((q, index) => ({ ...q, sortOrder: index })),
    );
  }

  function patchQuestion(id: string, patch: Partial<ScreeningQuestion>) {
    updateQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function changeQuestionType(id: string, type: ScreeningQuestionType) {
    const current = questions.find((q) => q.id === id);
    if (!current) return;
    patchQuestion(id, {
      type,
      options:
        type === ScreeningQuestionType.SINGLE_CHOICE
          ? current.options?.length
            ? current.options
            : ['Immediate', '15 days', '30 days', '60+ days']
          : undefined,
    });
  }

  function removeQuestion(id: string) {
    updateQuestions(questions.filter((q) => q.id !== id));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    const index = questions.findIndex((q) => q.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateQuestions(next);
  }

  function addQuestion(type: ScreeningQuestionType) {
    if (questions.length >= 10) return;
    updateQuestions([
      ...questions,
      createQuestion(type, '', questions.length),
    ]);
  }

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
        <label className="block text-sm font-medium text-moons-silver">Work mode *</label>
        <select
          value={values.workMode}
          onChange={(e) => onChange('workMode', e.target.value as WorkMode)}
          className={inputClass}
          required
        >
          {WORK_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
          minYears={values.minExperienceYears}
          maxYears={values.maxExperienceYears}
          onChange={(minYears, maxYears) => {
            onChange('minExperienceYears', minYears);
            onChange('maxExperienceYears', maxYears);
          }}
        />
        <p className="mt-1.5 text-xs text-moons-muted">Set a custom min–max range, or leave as Any.</p>
      </div>
    </div>
  );

  const descriptionField = (
    <div>
      <label className="block text-sm font-medium text-moons-silver">
        Description * (min 20 chars)
      </label>
      <div className="mt-1">
        <RichTextEditor
          value={values.description}
          onChange={(html) => onChange('description', html)}
          placeholder="Describe the role, responsibilities, and requirements…"
          minLength={20}
        />
      </div>
    </div>
  );

  const screeningField = (
    <div className="space-y-4">
      <p className="text-sm text-moons-muted">
        Optional questions candidates answer when they apply. You can change the type, edit the
        wording, and manage multiple-choice answers one at a time.
      </p>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center">
          <p className="text-sm font-medium text-heading">No screening questions yet</p>
          <p className="mt-1 text-xs text-moons-muted">
            Add up to 10 questions — start with a common one below.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => addQuestion(ScreeningQuestionType.SINGLE_CHOICE)}
              className="rounded-full bg-moons-blue px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-moons-blue-dark"
            >
              + Notice period
            </button>
            <button
              type="button"
              onClick={() => addQuestion(ScreeningQuestionType.YES_NO)}
              className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40"
            >
              + Availability
            </button>
            <button
              type="button"
              onClick={() => addQuestion(ScreeningQuestionType.RESUME)}
              className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40"
            >
              + Ask for CV
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="rounded-xl border border-border/70 bg-surface-elevated p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-moons-muted">
                    Question {index + 1}
                  </span>
                  <select
                    value={question.type}
                    onChange={(e) =>
                      changeQuestionType(question.id, e.target.value as ScreeningQuestionType)
                    }
                    className="rounded-full border border-moons-blue/20 bg-moons-blue/10 px-2.5 py-1 text-[11px] font-semibold text-moons-blue outline-none focus:ring-1 focus:ring-moons-blue/30"
                    aria-label={`Type for question ${index + 1}`}
                  >
                    {(Object.keys(QUESTION_TYPE_LABELS) as ScreeningQuestionType[]).map((type) => (
                      <option key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveQuestion(question.id, -1)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-moons-muted transition hover:bg-surface hover:text-heading disabled:opacity-40"
                    aria-label="Move question up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === questions.length - 1}
                    onClick={() => moveQuestion(question.id, 1)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-moons-muted transition hover:bg-surface hover:text-heading disabled:opacity-40"
                    aria-label="Move question down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <label className="mt-3 block text-sm font-medium text-moons-silver">
                Question text *
              </label>
              <textarea
                required
                minLength={3}
                maxLength={300}
                rows={2}
                value={question.prompt}
                onChange={(e) => patchQuestion(question.id, { prompt: e.target.value })}
                className={`${inputClass} resize-y`}
                placeholder={
                  question.type === ScreeningQuestionType.RESUME
                    ? 'e.g. Upload your latest CV / resume'
                    : question.type === ScreeningQuestionType.YES_NO
                      ? 'e.g. Are you currently available to join?'
                      : question.type === ScreeningQuestionType.SINGLE_CHOICE
                        ? 'e.g. What is your notice period?'
                        : 'e.g. Why are you a good fit for this role?'
                }
              />
              <p className="mt-1 text-right text-[11px] text-moons-muted">
                {question.prompt.length}/300
              </p>

              {question.type === ScreeningQuestionType.SINGLE_CHOICE && (
                <ChoiceOptionsEditor
                  options={question.options ?? ['', '']}
                  onChange={(next) =>
                    patchQuestion(question.id, {
                      options: next.map((line) => line.trimEnd()).slice(0, 10),
                    })
                  }
                />
              )}

              {question.type === ScreeningQuestionType.YES_NO && (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-moons-muted ring-1 ring-border/60">
                  Applicants will choose <span className="font-semibold text-heading">Yes</span> or{' '}
                  <span className="font-semibold text-heading">No</span>.
                </p>
              )}

              {question.type === ScreeningQuestionType.RESUME && (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-moons-muted ring-1 ring-border/60">
                  Applicants will upload a CV / resume file for this question.
                </p>
              )}

              <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => patchQuestion(question.id, { required: e.target.checked })}
                  className="rounded border-border"
                />
                Required answer
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={questions.length >= 10}
          onClick={() => addQuestion(ScreeningQuestionType.RESUME)}
          className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover disabled:opacity-50"
        >
          + Ask for CV
        </button>
        <button
          type="button"
          disabled={questions.length >= 10}
          onClick={() => addQuestion(ScreeningQuestionType.TEXT)}
          className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover disabled:opacity-50"
        >
          + Text question
        </button>
        <button
          type="button"
          disabled={questions.length >= 10}
          onClick={() => addQuestion(ScreeningQuestionType.YES_NO)}
          className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover disabled:opacity-50"
        >
          + Yes / No
        </button>
        <button
          type="button"
          disabled={questions.length >= 10}
          onClick={() => addQuestion(ScreeningQuestionType.SINGLE_CHOICE)}
          className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface-hover disabled:opacity-50"
        >
          + Multiple choice
        </button>
      </div>
      {questions.length > 0 && (
        <p className="text-xs text-moons-muted">{questions.length}/10 questions added</p>
      )}
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
        <Section title="Application questions">{screeningField}</Section>
      </div>
    );
  }

  return (
    <>
      {titleField}
      {companyField}
      {roleDetails}
      {descriptionField}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold text-heading">Application questions</h3>
        {screeningField}
      </div>
    </>
  );
}

export function experienceBandToYears(minYears: string, maxYears: string) {
  return experienceRangeToJobYears(minYears, maxYears);
}

export function yearsToExperienceBand(
  min: number | null | undefined,
  max: number | null | undefined,
) {
  const range = jobYearsToExperienceRange(min, max);
  return {
    minExperienceYears: range.minYears,
    maxExperienceYears: range.maxYears,
  };
}

export type { JobFormValues };
