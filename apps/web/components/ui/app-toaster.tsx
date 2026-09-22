'use client';

import { useEffect, useState } from 'react';
import {
  dismissToast,
  subscribeToasts,
  type AppToast,
} from '@/lib/toast';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M4.5 10.5 8 14l7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9v4.5M10 6.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function ToastCard({ toast }: { toast: AppToast }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const hide = window.setTimeout(() => setLeaving(true), toast.durationMs);
    const remove = window.setTimeout(() => dismissToast(toast.id), toast.durationMs + 320);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, [toast.durationMs, toast.id]);

  const isSuccess = toast.kind === 'success';
  const isError = toast.kind === 'error';

  return (
    <div
      className={`pointer-events-auto w-full overflow-hidden rounded-2xl border shadow-[0_20px_50px_-12px_rgba(26,39,68,0.28)] backdrop-blur-md transition-all duration-500 ease-out dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] ${
        entered && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
      } ${
        isSuccess
          ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:border-emerald-500/35 dark:from-emerald-500/10 dark:via-surface-elevated dark:to-emerald-500/5'
          : isError
            ? 'border-red-300/80 bg-gradient-to-br from-red-50 via-white to-red-50/60 dark:border-red-500/35 dark:from-red-500/10 dark:via-surface-elevated dark:to-red-500/5'
            : 'border-border/70 bg-gradient-to-br from-white via-surface-elevated to-moons-blue/[0.06] dark:from-surface-elevated dark:via-surface-elevated dark:to-moons-blue/10'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-2 ring-white dark:ring-surface-elevated ${
            isSuccess
              ? 'bg-emerald-100 text-emerald-700'
              : isError
                ? 'bg-red-100 text-red-700'
                : 'bg-moons-blue/10 text-moons-blue'
          }`}
        >
          {isSuccess ? (
            <CheckIcon className="h-4 w-4" />
          ) : isError ? (
            <XIcon className="h-4 w-4" />
          ) : (
            <InfoIcon className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-bold leading-snug text-heading">{toast.title}</p>
          {toast.description ? (
            <p
              className={`mt-1 text-xs leading-relaxed ${
                isSuccess
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : isError
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-moons-muted'
              }`}
            >
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="rounded-full p-1 text-moons-muted transition hover:bg-surface hover:text-heading"
          aria-label="Dismiss"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AppToaster() {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (!toasts.length) return null;

  return (
    <>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </>
  );
}
