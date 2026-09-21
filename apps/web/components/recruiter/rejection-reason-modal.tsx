'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MAX_REASON_LENGTH = 500;

export function RejectionReasonModal({
  open,
  candidateName,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  candidateName: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-reason-title"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Cancel"
        disabled={loading}
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_24px_60px_-12px_rgba(26,39,68,0.35)]">
        <div className="h-1 w-full bg-gradient-to-r from-red-400 via-red-500 to-red-600" />
        <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <h2 id="reject-reason-title" className="text-lg font-bold text-heading">
            Reject {candidateName}?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-moons-muted">
            Optionally share a short reason. The candidate will see it in their application update.
          </p>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-moons-muted">
              Reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
              rows={4}
              maxLength={MAX_REASON_LENGTH}
              placeholder="e.g. Looking for more years of relevant experience"
              className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/20"
              disabled={loading}
            />
            <span className="mt-1 block text-right text-[11px] text-moons-muted">
              {reason.length}/{MAX_REASON_LENGTH}
            </span>
          </label>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-hover disabled:opacity-60"
            >
              Keep reviewing
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reason.trim())}
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? 'Rejecting…' : 'Reject candidate'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
