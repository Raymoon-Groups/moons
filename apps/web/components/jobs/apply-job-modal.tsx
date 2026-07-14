'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ScreeningQuestionType,
  type ScreeningAnswer,
  type ScreeningQuestion,
} from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { authFetch, authUpload } from '@/lib/api-client';
import type { JobListing } from '@/lib/jobs';
import { notifyNotificationsRefresh } from '@/lib/notifications';
import type { Profile } from '@/lib/types';

type Step = 'questions' | 'preview';

export function ApplyJobModal({
  open,
  job,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  job: JobListing;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState<Step>('questions');
  const [coverNote, setCoverNote] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeMeta, setResumeMeta] = useState<{ url: string; fileName: string | null } | null>(
    null,
  );
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  const questions = useMemo(
    () =>
      [...(job.screeningQuestions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder) as ScreeningQuestion[],
    [job.screeningQuestions],
  );

  useEffect(() => {
    if (!open) return;

    setStep('questions');
    setCoverNote('');
    setAnswers({});
    setResumeMeta(null);
    setError('');
    setSubmitting(false);

    let cancelled = false;
    void (async () => {
      try {
        const me = await authFetch<Profile>('/profiles/me');
        if (cancelled) return;
        setProfile(me);
        if (me.resumeUrl) {
          setResumeMeta({ url: me.resumeUrl, fileName: me.resumeFileName });
          const resumeAnswers: Record<string, string> = {};
          for (const q of job.screeningQuestions ?? []) {
            if (q.type === ScreeningQuestionType.RESUME) {
              resumeAnswers[q.id] = me.resumeUrl;
            }
          }
          setAnswers(resumeAnswers);
        }
      } catch {
        // optional
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, job.id, job.screeningQuestions]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleResumeUpload(question: ScreeningQuestion, file: File | null) {
    if (!file) return;
    setUploadingResume(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const saved = await authUpload<Profile>('/profiles/me/resume', formData);
      if (saved.resumeUrl) {
        setResumeMeta({ url: saved.resumeUrl, fileName: saved.resumeFileName });
        setAnswer(question.id, saved.resumeUrl);
        setProfile(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume upload failed');
    } finally {
      setUploadingResume(false);
    }
  }

  function validateQuestions(): string | null {
    for (const q of questions) {
      const value = answers[q.id]?.trim() ?? '';
      if (q.required && !value) {
        return `Please answer: ${q.prompt}`;
      }
    }
    return null;
  }

  function buildScreeningAnswers(): ScreeningAnswer[] {
    const result: ScreeningAnswer[] = [];
    for (const q of questions) {
      const value = answers[q.id]?.trim() ?? '';
      if (!value) continue;
      result.push({
        questionId: q.id,
        value,
        fileName:
          q.type === ScreeningQuestionType.RESUME ? resumeMeta?.fileName ?? null : undefined,
      });
    }
    return result;
  }

  function goToPreview() {
    const validationError = validateQuestions();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep('preview');
  }

  async function handleSubmit() {
    const validationError = validateQuestions();
    if (validationError) {
      setError(validationError);
      setStep('questions');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await authFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          coverNote: coverNote.trim() || undefined,
          screeningAnswers: buildScreeningAnswers(),
        }),
      });
      notifyNotificationsRefresh();
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = profile?.fullName?.trim() || profile?.email || 'Your profile';
  const questionCount = questions.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-job-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        disabled={submitting}
        onClick={onClose}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-surface-elevated shadow-2xl ring-1 ring-border/60 sm:rounded-2xl">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-moons-blue">
                Apply for this job
              </p>
              <h2 id="apply-job-title" className="mt-1 truncate text-lg font-bold text-heading">
                {job.title}
              </h2>
              <p className="mt-0.5 truncate text-sm text-moons-muted">
                {job.companyName}
                {job.location ? ` · ${job.location}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full p-1.5 text-moons-muted transition hover:bg-surface hover:text-heading disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <StepPill active={step === 'questions'} done={step === 'preview'} label="1. Questions" />
            <div className="h-px flex-1 bg-border" />
            <StepPill active={step === 'preview'} done={false} label="2. Preview & submit" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === 'questions' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-heading">
                  {questionCount > 0
                    ? `Answer ${questionCount} question${questionCount === 1 ? '' : 's'} from the employer`
                    : 'Complete your application'}
                </h3>
                <p className="mt-1 text-xs text-moons-muted">
                  Fill in the details below, then preview before submitting.
                </p>
              </div>

              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-border/70 bg-surface/40 p-4"
                >
                  <label className="block text-sm font-semibold text-heading">
                    <span className="mr-2 text-xs font-bold text-moons-muted">Q{index + 1}.</span>
                    {question.prompt}
                    {question.required ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : (
                      <span className="ml-1 text-xs font-normal text-moons-muted">(optional)</span>
                    )}
                  </label>

                  {question.type === ScreeningQuestionType.TEXT && (
                    <textarea
                      rows={3}
                      value={answers[question.id] ?? ''}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/15"
                      placeholder="Type your answer…"
                    />
                  )}

                  {question.type === ScreeningQuestionType.YES_NO && (
                    <div className="mt-3 flex gap-2">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswer(question.id, option)}
                          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                            answers[question.id] === option
                              ? 'bg-moons-blue text-white shadow-sm'
                              : 'border border-border bg-surface-elevated text-heading hover:bg-surface-hover'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.type === ScreeningQuestionType.SINGLE_CHOICE && (
                    <select
                      value={answers[question.id] ?? ''}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-moons-blue"
                    >
                      <option value="">Select an option</option>
                      {(question.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {question.type === ScreeningQuestionType.RESUME && (
                    <div className="mt-3 space-y-2">
                      {resumeMeta?.url ? (
                        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Ready: {resumeMeta.fileName || 'Resume on file'}
                        </p>
                      ) : (
                        <p className="text-xs text-moons-muted">
                          Upload a PDF or DOC resume for this application.
                        </p>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf"
                        disabled={uploadingResume}
                        onChange={(e) =>
                          void handleResumeUpload(question, e.target.files?.[0] ?? null)
                        }
                        className="block w-full text-xs text-moons-muted file:mr-3 file:rounded-full file:border-0 file:bg-moons-blue/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-moons-blue"
                      />
                      {uploadingResume && (
                        <p className="text-xs text-moons-muted">Uploading…</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-heading">
                  Cover note <span className="font-normal text-moons-muted">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  maxLength={1000}
                  className="mt-2 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/15"
                  placeholder="Tell the recruiter why you're a great fit…"
                />
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-heading">Preview your application</h3>
                <p className="mt-1 text-xs text-moons-muted">
                  Review everything before you submit. You can go back to edit answers.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-moons-muted">
                  Applying as
                </p>
                <p className="mt-1 text-sm font-semibold text-heading">{displayName}</p>
                {profile?.headline && (
                  <p className="mt-0.5 text-xs text-moons-muted">{profile.headline}</p>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-surface/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-moons-muted">
                  Job
                </p>
                <p className="mt-1 text-sm font-semibold text-heading">{job.title}</p>
                <p className="mt-0.5 text-xs text-moons-muted">
                  {job.companyName}
                  {job.location ? ` · ${job.location}` : ''}
                </p>
              </div>

              {questions.length > 0 && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-surface/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-moons-muted">
                    Your answers
                  </p>
                  {questions.map((question) => {
                    const value = answers[question.id]?.trim() ?? '';
                    const isResume = question.type === ScreeningQuestionType.RESUME;
                    const href = isResume ? resolveAssetUrl(value) : null;
                    return (
                      <div key={question.id} className="border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
                        <p className="text-xs font-semibold text-heading">{question.prompt}</p>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex text-sm text-moons-blue hover:underline"
                          >
                            {resumeMeta?.fileName || 'View resume'}
                          </a>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                            {value || <span className="text-moons-muted">—</span>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-xl border border-border/70 bg-surface/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-moons-muted">
                  Cover note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {coverNote.trim() || (
                    <span className="text-moons-muted">No cover note added</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface/50 px-5 py-4">
          {step === 'questions' ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToPreview}
                disabled={uploadingResume}
                className="rounded-xl bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-60"
              >
                Review application →
              </button>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('questions');
                }}
                disabled={submitting}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-hover disabled:opacity-60"
              >
                ← Edit answers
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || uploadingResume}
                className="rounded-xl bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
        active
          ? 'bg-moons-blue text-white'
          : done
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-surface text-moons-muted ring-1 ring-border/70'
      }`}
    >
      {label}
    </span>
  );
}
