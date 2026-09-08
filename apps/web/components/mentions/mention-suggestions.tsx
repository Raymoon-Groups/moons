'use client';

import { resolveAssetUrl } from '@/lib/assets';
import type { MentionPerson } from '@/lib/use-mention-composer';

export function MentionSuggestions({
  people,
  onSelect,
}: {
  people: MentionPerson[];
  onSelect: (person: MentionPerson) => void;
}) {
  if (!people.length) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
      <p className="px-3 pt-2.5 text-[11px] font-semibold text-moons-muted">
        Mention someone in your network
      </p>
      <ul className="max-h-56 overflow-y-auto py-1">
        {people.map((person) => {
          const avatar = resolveAssetUrl(person.avatarUrl);
          const initial = person.fullName[0]?.toUpperCase() || '?';
          return (
            <li key={person.userId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(person)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-moons-blue/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moons-blue/15 text-sm font-bold text-moons-blue">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-heading">
                    {person.fullName}
                  </span>
                  {person.headline ? (
                    <span className="block truncate text-xs text-moons-muted">{person.headline}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
