'use client';

import { useEffect } from 'react';

type ConfirmTone = 'default' | 'warning' | 'danger';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_STYLES: Record<
  ConfirmTone,
  { iconWrap: string; icon: string; confirmBtn: string }
> = {
  default: {
    iconWrap: 'bg-moons-blue/10 text-moons-blue ring-moons-blue/20',
    icon: '?',
    confirmBtn: 'bg-moons-blue text-white hover:bg-moons-blue-dark shadow-moons-blue/20',
  },
  warning: {
    iconWrap: 'bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300',
    icon: '!',
    confirmBtn: 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20',
  },
  danger: {
    iconWrap: 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-300',
    icon: '✕',
    confirmBtn: 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20',
  },
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const styles = TONE_STYLES[tone];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Cancel"
        disabled={loading}
        onClick={onCancel}
      />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_24px_60px_-12px_rgba(26,39,68,0.35)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)] max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div
          className={`h-1 w-full ${
            tone === 'danger'
              ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
              : tone === 'warning'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-moons-blue via-sky-400 to-moons-blue'
          }`}
        />

        <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ring-1 ${styles.iconWrap}`}
              aria-hidden
            >
              {styles.icon}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="confirm-modal-title" className="text-lg font-bold text-heading">
                {title}
              </h2>
              <p
                id="confirm-modal-desc"
                className="mt-1.5 text-sm leading-relaxed text-moons-muted"
              >
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-hover disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition disabled:opacity-60 ${styles.confirmBtn}`}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
