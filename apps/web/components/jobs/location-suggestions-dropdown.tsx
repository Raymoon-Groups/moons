'use client';

import {
  splitLocationHighlight,
  type LocationSuggestion,
} from '@/lib/location-suggestions';

const MAX_VISIBLE = 5;
const LIST_MAX_HEIGHT = '13.5rem';

export function LocationSuggestionsDropdown({
  query,
  suggestions,
  loading = false,
  onSelect,
  className = '',
}: {
  query: string;
  suggestions: LocationSuggestion[];
  loading?: boolean;
  onSelect: (item: LocationSuggestion) => void;
  className?: string;
}) {
  const showScroll = !loading && suggestions.length > MAX_VISIBLE;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#e8e8e8] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] ${className}`}
      role="listbox"
    >
      <ul
        className={`py-1 ${showScroll ? 'suggestions-scroll overflow-y-scroll' : ''}`}
        style={showScroll ? { maxHeight: LIST_MAX_HEIGHT } : undefined}
      >
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={`loc-sk-${i}`} className="px-4 py-2.5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
            </li>
          ))}

        {!loading &&
          suggestions.map((item) => {
            const parts = splitLocationHighlight(item.name, query);
            return (
              <li key={item.name}>
                <button
                  type="button"
                  role="option"
                  onClick={() => onSelect(item)}
                  className="w-full px-4 py-2.5 text-left text-[15px] leading-snug text-[#1a1a1a] transition hover:bg-[#f5f5f5]"
                >
                  {parts.match ? (
                    <>
                      {parts.before}
                      <span className="font-semibold">{parts.match}</span>
                      {parts.after}
                    </>
                  ) : (
                    item.name
                  )}
                </button>
              </li>
            );
          })}

        {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
          <li className="px-4 py-3 text-sm text-moons-muted">No locations found</li>
        )}
      </ul>
    </div>
  );
}
