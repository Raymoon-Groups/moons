'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/api-client';
import {
  OPEN_ON_MOONS_DESCRIPTION,
  OPEN_ON_MOONS_LABEL,
  OPEN_ON_MOONS_TAGLINE,
} from '@/lib/open-on-moons';
import type { Profile } from '@/lib/types';

export function OpenOnMoonsToggle({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (profile: Profile) => void;
}) {
  const [enabled, setEnabled] = useState(Boolean(profile.openToWork));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setError('');
    try {
      const saved = await authFetch<Profile>('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({ openToWork: next }),
      });
      setEnabled(Boolean(saved.openToWork));
      onUpdated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dash-card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moons-blue/12 text-sm font-bold text-moons-blue">
              M
            </span>
            <h2 className="text-base font-semibold text-heading">{OPEN_ON_MOONS_LABEL}</h2>
          </div>
          <p className="mt-2 text-sm font-medium text-moons-blue">{OPEN_ON_MOONS_TAGLINE}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-moons-muted">{OPEN_ON_MOONS_DESCRIPTION}</p>
          {enabled && (
            <p className="mt-3 inline-flex items-center rounded-full bg-moons-blue/10 px-2.5 py-1 text-[11px] font-semibold text-moons-blue ring-1 ring-moons-blue/20">
              Visible to recruiters on Moons
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${OPEN_ON_MOONS_LABEL} ${enabled ? 'on' : 'off'}`}
          disabled={saving}
          onClick={() => void toggle()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
            enabled ? 'bg-moons-blue' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
              enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
      {error && <p className="border-t border-border px-5 py-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
