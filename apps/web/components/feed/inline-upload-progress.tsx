'use client';

import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function InlineUploadProgress({
  progress,
  label,
  onSuccessHoldComplete,
}: {
  progress: number;
  label: string;
  onSuccessHoldComplete?: () => void;
}) {
  const target = Math.max(0, Math.min(100, progress));
  const [visual, setVisual] = useState(() => Math.min(target, 6));
  const [phase, setPhase] = useState<'uploading' | 'success'>('uploading');
  const visualRef = useRef(visual);
  const targetRef = useRef(target);
  const holdDone = useRef(false);
  const finishRef = useRef<{ from: number; startedAt: number; duration: number } | null>(null);
  const onCompleteRef = useRef(onSuccessHoldComplete);
  onCompleteRef.current = onSuccessHoldComplete;
  targetRef.current = target;
  visualRef.current = visual;

  // Single smooth clock — never snaps; when done, eases into 100 then success.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const goal = targetRef.current;
      let next = visualRef.current;

      if (goal >= 100) {
        if (!finishRef.current) {
          const from = visualRef.current;
          finishRef.current = {
            from,
            startedAt: now,
            duration: Math.max(700, Math.min(1600, (100 - from) * 22)),
          };
        }
        const fin = finishRef.current;
        const t = Math.min(1, (now - fin.startedAt) / fin.duration);
        next = fin.from + (100 - fin.from) * easeOutCubic(t);
        if (t >= 1) {
          visualRef.current = 100;
          setVisual(100);
          setPhase('success');
          return;
        }
      } else {
        finishRef.current = null;
        const remaining = goal - next;
        if (Math.abs(remaining) > 0.05) {
          // Calm chase — ~9%/s base, never a jump.
          const speed = Math.max(5.5, Math.min(11, Math.abs(remaining) * 0.85));
          next = remaining > 0 ? Math.min(goal, next + speed * dt) : Math.max(goal, next - speed * dt);
        }
      }

      visualRef.current = next;
      setVisual(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (phase !== 'success' || holdDone.current) return;
    holdDone.current = true;
    const id = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, 1000);
    return () => window.clearTimeout(id);
  }, [phase]);

  const pct = Math.round(visual);
  const widthPct = Math.min(100, Math.max(0, visual));

  if (phase === 'success') {
    return (
      <div
        className="sticky top-0 z-40 -mx-1 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/80 shadow-sm dark:from-emerald-500/20 dark:via-surface-elevated dark:to-emerald-500/10"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 animate-[upload-label-swap_360ms_ease-out]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] animate-[upload-icon-done_420ms_ease-out]">
            ✓
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Your post is posted
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">
              Updating your feed…
            </p>
          </div>
        </div>
        <div className="mx-4 mb-3 h-2 overflow-hidden rounded-full bg-emerald-500/20">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-40 -mx-1 overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated/95 shadow-sm backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moons-blue/10">
          <span className="absolute inset-0 rounded-full border-2 border-moons-blue/25 border-t-moons-blue animate-spin [animation-duration:1.1s]" />
          <span className="h-2 w-2 rounded-full bg-moons-blue shadow-[0_0_10px_rgba(63,116,204,0.7)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading">{label}</p>
          <p className="text-xs text-moons-muted">Your post will appear when this finishes</p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-moons-blue">
          {pct}%
        </span>
      </div>
      <div className="mx-4 mb-3 h-2 overflow-hidden rounded-full bg-moons-blue/10">
        <div
          className="relative h-full overflow-hidden rounded-full"
          style={{
            width: `${widthPct}%`,
            background: 'linear-gradient(90deg, #2f5fad 0%, #3f74cc 45%, #6ea0ef 100%)',
            boxShadow: '0 0 14px rgba(63, 116, 204, 0.35)',
          }}
        >
          <div className="absolute inset-0 -translate-x-full animate-[upload-shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>
      </div>
    </div>
  );
}
