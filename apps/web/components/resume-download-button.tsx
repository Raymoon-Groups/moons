'use client';

import { useState } from 'react';
import { openResumeFile } from '@/lib/open-resume';

export function ResumeDownloadButton({
  url,
  fileName,
  label,
  className,
  busyLabel = 'Opening…',
}: {
  url: string | null | undefined;
  fileName?: string | null;
  label?: string;
  className?: string;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!url) return null;

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await openResumeFile(url, fileName);
    if (!result.ok) setError(result.message);
    setBusy(false);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className={
          className ??
          'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-moons-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-60'
        }
      >
        <span className="truncate">{busy ? busyLabel : label || fileName || 'Download resume'}</span>
      </button>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
