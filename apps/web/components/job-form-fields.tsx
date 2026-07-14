'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  EmploymentType,
  ScreeningQuestionType,
  type ScreeningQuestion,
} from '@moons/shared';
import { ExperienceRequiredPicker } from '@/components/jobs/experience-required-picker';
import { RichTextEditor } from '@/components/rich-text-editor';
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
  screeningQuestions: ScreeningQuestion[];
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
    options: type === ScreeningQuestionType.SINGLE_CHOICE ? ['Yes', 'No'] : undefined,
    sortOrder,
  };
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

  function removeQuestion(id: string) {
    updateQuestions(questions.filter((q) => q.id !== id));
  }

  function addQuestion(type: ScreeningQuestionType) {
    if (questions.length >= 10) return;
    const prompts: Record<ScreeningQuestionType, string> = {
      [ScreeningQuestionType.TEXT]: 'Why are you a good fit for this role?',
      [ScreeningQuestionType.YES_NO]: 'Are you currently available to join?',
      [ScreeningQuestionType.SINGLE_CHOICE]: 'What is your notice period?',
      [ScreeningQuestionType.RESUME]: 'Upload your latest CV / resume',
    };
    updateQuestions([
      ...questions,
      createQuestion(type, prompts[type], questions.length),
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
        Ask applicants custom questions or request their latest CV. Candidates must answer these
        when they apply.
      </p>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center">
          <p className="text-sm font-medium text-heading">No screening questions yet</p>
          <p className="mt-1 text-xs text-moons-muted">
            Optional — add up to 10 questions for this job.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="rounded-xl border border-border/70 bg-surface-elevated p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-moons-muted">
                  Question {index + 1}
                  <span className="ml-2 rounded-full bg-moons-blue/10 px-2 py-0.5 text-[10px] font-semibold text-moons-blue">
                    {question.type === ScreeningQuestionType.RESUME
                      ? 'CV upload'
                      : question.type === ScreeningQuestionType.YES_NO
                        ? 'Yes / No'
                        : question.type === ScreeningQuestionType.SINGLE_CHOICE
                          ? 'Multiple choice'
                          : 'Text answer'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              <label className="mt-3 block text-sm font-medium text-moons-silver">
                Question text *
              </label>
              <input
                required
                minLength={3}
                maxLength={300}
                value={question.prompt}
                onChange={(e) => patchQuestion(question.id, { prompt: e.target.value })}
                className={inputClass}
                placeholder="What do you want applicants to answer?"
              />

              {question.type === ScreeningQuestionType.SINGLE_CHOICE && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-moons-silver">
                    Options (one per line, min 2)
                  </label>
                  <textarea
                    rows={3}
                    value={(question.options ?? []).join('\n')}
                    onChange={(e) =>
                      patchQuestion(question.id, {
                        options: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .slice(0, 10),
                      })
                    }
                    className={inputClass}
                    placeholder={'Immediate\n15 days\n30 days\n60+ days'}
                  />
                </div>
              )}

              <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => patchQuestion(question.id, { required: e.target.checked })}
                  className="rounded border-border"
                />
                Required
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
