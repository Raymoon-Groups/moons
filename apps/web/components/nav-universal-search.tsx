'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { buildJobsSearchUrl } from '@/lib/jobs-search';
import {
  fetchSearchSuggestions,
  type SearchSuggestion,
} from '@/lib/search-suggestions';

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-moons-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function suggestionTypeLabel(type: SearchSuggestion['type']) {
  switch (type) {
    case 'job':
      return 'Job';
    case 'company':
      return 'Company';
    case 'skill':
      return 'Search';
    default:
      return '';
  }
}

export function NavUniversalSearch({
  className = '',
  stretched = false,
}: {
  className?: string;
  /** Full-width pill bar like the header search row */
  stretched?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!pathname.startsWith('/jobs') || typeof window === 'undefined') return;
    const qParam = new URLSearchParams(window.location.search).get('q');
    if (qParam) setQuery(qParam);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      fetchSearchSuggestions(trimmed)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function goToJobsSearch(term?: string) {
    const value = (term ?? query).trim();
    router.push(buildJobsSearchUrl({ q: value || undefined }));
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setQuery(suggestion.label);
    setOpen(false);
    setActiveIndex(-1);
    router.push(suggestion.href);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    goToJobsSearch();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && query.trim().length >= 2) setOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  const canSuggest = query.trim().length >= 2;
  const showDropdown = open && canSuggest && (loading || suggestions.length > 0);
  const sectionTitle = 'Suggestions';

  function updateQuery(value: string) {
    setQuery(value);
    setOpen(value.trim().length >= 2);
    setActiveIndex(-1);
  }

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className={`flex w-full items-center rounded-full border border-border bg-surface transition focus-within:border-moons-blue/50 focus-within:ring-2 focus-within:ring-moons-blue/20 ${
            stretched ? 'px-4 py-2.5' : 'px-3 py-1.5'
          }`}
        >
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, skills, companies..."
            className="min-w-0 flex-1 bg-transparent px-3 py-0.5 text-sm text-foreground outline-none placeholder:text-moons-muted"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="nav-search-suggestions"
          />
        </div>
      </form>

      {showDropdown && (
        <div
          id="nav-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
        >
          <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
            {loading ? 'Searching…' : sectionTitle}
          </div>

          <ul className="max-h-72 overflow-y-auto py-1">
            {!loading &&
              suggestions.map((item, index) => (
                <li key={`${item.type}-${item.label}-${index}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(item)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                      index === activeIndex ? 'bg-surface-hover' : 'hover:bg-surface'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                      {suggestionTypeLabel(item.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-heading">
                        {item.label}
                      </span>
                      {item.meta && (
                        <span className="block truncate text-xs text-moons-muted">{item.meta}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}

            {!loading && suggestions.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-moons-muted">No matches found</li>
            )}
          </ul>

          {!loading && query.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => goToJobsSearch()}
              className="w-full border-t border-border px-3 py-2.5 text-left text-sm font-semibold text-moons-blue transition hover:bg-surface"
            >
              Search all jobs for &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
