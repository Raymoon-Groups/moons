'use client';

import {
  ScreeningQuestionType,
  type ScreeningAnswer,
  type ScreeningQuestion,
} from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';

function isYesNoValue(value: string) {
  const v = value.trim().toLowerCase();
  return v === 'yes' || v === 'no' || v === 'true' || v === 'false';
}

function YesNoBadge({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();
  const isYes = normalized === 'yes' || normalized === 'true';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold shadow-sm ${
        isYes
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {isYes ? 'Yes' : 'No'}
    </span>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

type PreparedAnswer = {
  answer: ScreeningAnswer;
  question?: ScreeningQuestion;
  label: string;
  isResume: boolean;
  href: string | null;
};

export function ScreeningAnswersList({
  questions,
  answers,
  className = '',
}: {
  questions?: ScreeningQuestion[] | null;
  answers?: ScreeningAnswer[] | null;
  className?: string;
}) {
  if (!answers?.length) return null;

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));

  const prepared: PreparedAnswer[] = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isResume =
      question?.type === ScreeningQuestionType.RESUME ||
      answer.value.startsWith('/uploads/resumes/');
    return {
      answer,
      question,
      label: question?.prompt ?? (isResume ? 'Resume' : 'Answer'),
      isResume,
      href: isResume ? resolveAssetUrl(answer.value) : null,
    };
  });

  const resumeItems = prepared.filter((item) => item.isResume);
  const questionItems = prepared.filter((item) => !item.isResume);

  return (
    <div className={`space-y-3 ${className}`}>
      {resumeItems.map(({ answer, href, label }) => (
        <a
          key={answer.questionId}
          href={href ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3.5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:border-moons-blue/25 hover:bg-white"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-moons-blue/10 to-sky-100 text-moons-blue">
            <DocumentIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
              {label}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-heading group-hover:text-moons-blue">
              {answer.fileName || 'View resume'}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-moons-blue">Open</span>
        </a>
      ))}

      {questionItems.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/85 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-border/50 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moons-blue/10 text-moons-blue">
              <ChatIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-heading">Screening answers</p>
              <p className="text-xs text-moons-muted">
                {questionItems.length} response{questionItems.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <ol className="divide-y divide-border/40">
            {questionItems.map(({ answer, question, label }, index) => {
              const type = question?.type;
              const showYesNo =
                type === ScreeningQuestionType.YES_NO ||
                (type !== ScreeningQuestionType.TEXT &&
                  type !== ScreeningQuestionType.SINGLE_CHOICE &&
                  isYesNoValue(answer.value));
              const showChoiceChip =
                type === ScreeningQuestionType.SINGLE_CHOICE ||
                (type === undefined &&
                  answer.value.length < 40 &&
                  !answer.value.includes('\n') &&
                  !showYesNo);

              return (
                <li key={answer.questionId} className="flex gap-3 px-4 py-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold tabular-nums text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-relaxed text-moons-muted">{label}</p>
                    <div className="mt-1.5">
                      {showYesNo ? (
                        <YesNoBadge value={answer.value} />
                      ) : showChoiceChip ? (
                        <span className="inline-flex rounded-full border border-border/70 bg-slate-50 px-3 py-1 text-sm font-semibold text-heading">
                          {answer.value}
                        </span>
                      ) : (
                        <p className="whitespace-pre-wrap rounded-2xl bg-slate-50/80 px-3.5 py-3 text-sm leading-relaxed text-foreground">
                          {answer.value}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

export function CoverNoteBlock({
  note,
  className = '',
}: {
  note: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 to-white px-4 py-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)] ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
        Cover note
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note}</p>
    </div>
  );
}
