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
    <div className={`picker-menu ${className}`} role="listbox">
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
                  className="picker-item w-full py-2.5"
                >
                  {parts.match ? (
                    <>
                      {parts.before}
                      <span className="font-semibold text-heading">{parts.match}</span>
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
