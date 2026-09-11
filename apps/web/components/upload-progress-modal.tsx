'use client';

import { useEffect, useState } from 'react';

type MediaKind = 'photo' | 'photos' | 'video' | 'post';

const KIND_META: Record<
  MediaKind,
  { icon: string; doneIcon: string; accent: string; ring: string }
> = {
  photo: {
    icon: '🖼️',
    doneIcon: '✓',
    accent: 'from-sky-500 to-moons-blue',
    ring: 'ring-sky-500/20',
  },
  photos: {
    icon: '🖼️',
    doneIcon: '✓',
    accent: 'from-sky-500 to-moons-blue',
    ring: 'ring-sky-500/20',
  },
  video: {
    icon: '🎬',
    doneIcon: '✓',
    accent: 'from-violet-500 to-moons-blue',
    ring: 'ring-violet-500/20',
  },
  post: {
    icon: '✨',
    doneIcon: '✓',
    accent: 'from-moons-blue to-moons-navy',
    ring: 'ring-moons-blue/20',
  },
};

export function UploadProgressModal({
  open,
  progress,
  label,
  detail,
  kind = 'post',
  fileSummary,
}: {
  open: boolean;
  progress: number;
  label: string;
  detail?: string;
  kind?: MediaKind;
  fileSummary?: string;
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setDisplayProgress(0);
      return;
    }
    const enterId = window.setTimeout(() => setEntered(true), 20);
    return () => window.clearTimeout(enterId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = Math.max(0, Math.min(100, progress));
    const start = displayProgress;
    const diff = target - start;
    if (Math.abs(diff) < 0.5) {
      setDisplayProgress(target);
      return;
    }
    const duration = Math.min(520, 180 + Math.abs(diff) * 6);
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayProgress(start + diff * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Only re-run when progress/open changes; displayProgress is the animation start value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, progress]);

  if (!open) return null;

  const clamped = Math.round(displayProgress);
  const meta = KIND_META[kind];
  const done = clamped >= 100;
  const stage = done ? 'Done' : clamped >= 92 ? 'Finishing' : clamped >= 12 ? 'Uploading' : 'Preparing';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0b1220]/55 backdrop-blur-[3px]"
        style={{ animation: 'upload-backdrop-in 280ms ease-out both' }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full max-w-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-surface-elevated shadow-[0_24px_80px_rgba(15,28,51,0.35)] transition-opacity duration-200 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ animation: 'upload-sheet-in 480ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        <div
          className={`h-1.5 bg-gradient-to-r ${meta.accent} transition-all duration-500`}
          aria-hidden
        />

        <div className="px-6 pb-6 pt-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-moons-blue">
            MoonsJob
          </p>

          <div
            key={done ? 'done' : 'busy'}
            className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${meta.accent} text-2xl text-white shadow-lg ring-8 ${meta.ring}`}
            style={{
              animation: done
                ? 'upload-icon-done 520ms cubic-bezier(0.22, 1, 0.36, 1) both'
                : 'upload-icon-pulse 1.6s ease-in-out infinite',
            }}
          >
            <span aria-hidden className="transition-transform duration-300">
              {done ? meta.doneIcon : meta.icon}
            </span>
          </div>

          <h2
            key={label}
            className="mt-4 text-xl font-bold tracking-tight text-heading"
            style={{ animation: 'upload-label-swap 320ms ease-out both' }}
          >
            {label}
          </h2>
          <p
            key={detail ?? 'default-detail'}
            className="mt-1.5 text-sm leading-relaxed text-moons-muted"
            style={{ animation: 'upload-label-swap 360ms ease-out both' }}
          >
            {detail ?? 'Keep this window open until the upload finishes.'}
          </p>
          {fileSummary ? (
            <p
              className="mt-2 inline-flex rounded-full bg-moons-blue/10 px-3 py-1 text-xs font-semibold text-moons-blue transition-all duration-300"
              style={{ animation: 'upload-label-swap 400ms ease-out both' }}
            >
              {fileSummary}
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-wide">
            {(['Preparing', 'Uploading', 'Finishing'] as const).map((step) => {
              const active =
                (step === 'Preparing' && clamped < 12) ||
                (step === 'Uploading' && clamped >= 12 && clamped < 92) ||
                (step === 'Finishing' && clamped >= 92);
              const complete =
                (step === 'Preparing' && clamped >= 12) ||
                (step === 'Uploading' && clamped >= 92) ||
                (step === 'Finishing' && clamped >= 100);
              return (
                <div
                  key={step}
                  className={`rounded-full px-2 py-1.5 transition-all duration-300 ${
                    active
                      ? 'bg-moons-blue text-white shadow-sm shadow-moons-blue/30'
                      : complete
                        ? 'bg-moons-blue/15 text-moons-blue'
                        : 'bg-surface text-moons-muted'
                  }`}
                  style={active ? { animation: 'upload-step-pop 360ms ease-out' } : undefined}
                >
                  {step}
                </div>
              );
            })}
          </div>

          <div className="relative mt-5 h-3 w-full overflow-hidden rounded-full bg-moons-blue/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${meta.accent}`}
              style={{
                width: `${displayProgress}%`,
                transition: 'width 80ms linear',
              }}
            />
            {!done ? (
              <div
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                style={{ animation: 'upload-shimmer 1.25s ease-in-out infinite' }}
              />
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span
              key={stage}
              className="font-medium text-moons-muted"
              style={{ animation: 'upload-label-swap 280ms ease-out both' }}
            >
              {stage}
            </span>
            <span
              key={clamped}
              className="font-bold tabular-nums text-heading"
              style={{ animation: 'upload-percent-pop 220ms ease-out both' }}
            >
              {clamped}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
