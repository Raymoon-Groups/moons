'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ExperiencePickerDropdown } from '@/components/jobs/experience-picker-dropdown';
import { LocationSuggestionsDropdown } from '@/components/jobs/location-suggestions-dropdown';
import {
  getExperienceSearchLabel,
  normalizeExperienceValue,
} from '@/lib/experience-options';
import { buildJobsSearchUrl } from '@/lib/jobs-search';
import {
  fetchLocationSuggestions,
  type LocationSuggestion,
} from '@/lib/location-suggestions';
import {
  fetchSearchSuggestions,
  type SearchSuggestion,
} from '@/lib/search-suggestions';

type HeroJobSearchFormProps = {
  initialQ?: string;
  initialLocation?: string;
  initialExperience?: string;
  /** Landing hero uses pill layout; jobs page uses compact row */
  variant?: 'landing' | 'compact';
  showClear?: boolean;
};

export function HeroJobSearchForm({
  initialQ = '',
  initialLocation = '',
  initialExperience = '',
  variant = 'landing',
  showClear = false,
}: HeroJobSearchFormProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const experienceAnchorRef = useRef<HTMLDivElement>(null);
  const experienceMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQ);
  const [location, setLocation] = useState(initialLocation);
  const [experience, setExperience] = useState(initialExperience);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experienceMenuStyle, setExperienceMenuStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQuery(initialQ);
    setLocation(initialLocation);
    setExperience(initialExperience ? normalizeExperienceValue(initialExperience) : '');
  }, [initialQ, initialLocation, initialExperience]);

  useEffect(() => {
    if (!suggestionsOpen) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = window.setTimeout(() => {
      fetchSearchSuggestions(trimmed)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, suggestionsOpen]);

  useEffect(() => {
    if (!locationOpen) return;

    const trimmed = location.trim();
    if (trimmed.length < 2) {
      setLocationSuggestions([]);
      setLoadingLocationSuggestions(false);
      return;
    }

    setLoadingLocationSuggestions(true);
    const timer = window.setTimeout(() => {
      fetchLocationSuggestions(trimmed)
        .then(setLocationSuggestions)
        .catch(() => setLocationSuggestions([]))
        .finally(() => setLoadingLocationSuggestions(false));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [location, locationOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (experienceMenuRef.current?.contains(target)) return;
      if (rootRef.current?.contains(target)) return;
      setSuggestionsOpen(false);
      setLocationOpen(false);
      setExperienceOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!experienceOpen || !experienceAnchorRef.current) return;

    const menuMaxHeightPx = 252;
    const gap = 8;

    function updateMenuPosition() {
      const anchor = experienceAnchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < menuMaxHeightPx && spaceAbove > spaceBelow;

      setExperienceMenuStyle(
        openUp
          ? {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              bottom: window.innerHeight - rect.top + gap,
              zIndex: 9999,
            }
          : {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              top: rect.bottom + gap,
              zIndex: 9999,
            },
      );
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [experienceOpen]);

  function runSearch(overrides?: { q?: string; location?: string; experience?: string }) {
    const href = buildJobsSearchUrl({
      q: overrides?.q ?? query,
      location: overrides?.location ?? location,
      experience: overrides?.experience ?? experience,
    });
    setSuggestionsOpen(false);
    setLocationOpen(false);
    setExperienceOpen(false);
    router.push(href);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setSuggestionsOpen(false);
    if (suggestion.type === 'job') {
      router.push(suggestion.href);
      return;
    }
    if (suggestion.type === 'company') {
      router.push(suggestion.href);
      return;
    }
    setQuery(suggestion.label);
    runSearch({ q: suggestion.label });
  }

  function updateQuery(value: string) {
    setQuery(value);
    setLocationOpen(false);
    setExperienceOpen(false);
    setSuggestionsOpen(value.trim().length >= 2);
  }

  function updateLocation(value: string) {
    setLocation(value);
    setSuggestionsOpen(false);
    setExperienceOpen(false);
    setLocationOpen(value.trim().length >= 2);
  }

  function selectLocation(item: LocationSuggestion) {
    setLocation(item.name);
    setLocationOpen(false);
    setLocationSuggestions([]);
  }

  function openExperiencePicker() {
    setSuggestionsOpen(false);
    setLocationOpen(false);
    setExperienceOpen((open) => !open);
  }

  function selectExperience(value: string) {
    setExperience(value);
    setExperienceOpen(false);
  }

  function clearAll() {
    setQuery('');
    setLocation('');
    setExperience('');
    setSuggestionsOpen(false);
    setSuggestions([]);
    setLocationOpen(false);
    setLocationSuggestions([]);
    setExperienceOpen(false);
    router.push('/jobs');
  }

  const isLanding = variant === 'landing';
  const canSuggest = query.trim().length >= 2;
  const showDropdown =
    suggestionsOpen && canSuggest && (loadingSuggestions || suggestions.length > 0);
  const canSuggestLocation = location.trim().length >= 2;
  const showLocationDropdown =
    locationOpen &&
    canSuggestLocation &&
    (loadingLocationSuggestions || locationSuggestions.length > 0);
  const experienceLabel = getExperienceSearchLabel(experience);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        ref={rootRef}
        className={
          isLanding
            ? 'relative flex flex-col items-stretch overflow-visible rounded-3xl border border-border bg-surface-elevated p-3 shadow-[0_8px_32px_rgba(26,39,68,0.08)] sm:flex-row sm:items-center sm:rounded-full sm:p-2'
            : 'relative mx-auto mt-8 flex max-w-4xl flex-col gap-2 overflow-visible rounded-2xl border border-white/20 bg-surface-elevated p-2 shadow-xl sm:flex-row sm:items-center'
        }
      >
        <div
          className={`relative min-w-0 flex-1 ${
            isLanding
              ? 'border-b border-border sm:border-b-0'
              : 'flex items-center gap-2 px-3 py-2'
          }`}
        >
          {isLanding ? (
            <label className="flex min-w-0 flex-1 cursor-text flex-col px-5 py-3.5 text-left sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">What</span>
              <input
                type="text"
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="Job title, skill, or company"
                className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-moons-muted md:text-base"
                autoComplete="off"
              />
            </label>
          ) : (
            <>
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="Job title or keyword"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
                autoComplete="off"
              />
            </>
          )}

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated text-left shadow-xl sm:left-4 sm:right-4 lg:left-8 lg:right-8">
              <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-moons-muted">
                {loadingSuggestions ? 'Searching…' : 'Suggestions'}
              </div>
              <ul className="max-h-60 overflow-y-auto py-1">
                {!loadingSuggestions &&
                  suggestions.map((item, index) => (
                    <li key={`${item.type}-${item.label}-${index}`}>
                      <button
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-surface"
                      >
                        <span className="mt-0.5 shrink-0 rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                          {item.type === 'job' ? 'Job' : item.type === 'company' ? 'Company' : 'Search'}
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
              </ul>
            </div>
          )}
        </div>

        {isLanding && (
          <div className="hidden h-12 w-px shrink-0 bg-border sm:block" aria-hidden />
        )}

        {!isLanding && <div className="hidden h-8 w-px bg-border sm:block" />}

        <div className="relative min-w-0 flex-1">
          {isLanding ? (
            <label className="flex min-w-0 flex-1 cursor-text flex-col border-b border-border px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">Where</span>
              <input
                type="text"
                value={location}
                onChange={(e) => updateLocation(e.target.value)}
                placeholder="City or remote"
                className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-moons-muted md:text-base"
                autoComplete="off"
              />
            </label>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
              <PinIcon />
              <input
                type="text"
                value={location}
                onChange={(e) => updateLocation(e.target.value)}
                placeholder="City or remote"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-moons-muted"
                autoComplete="off"
              />
            </div>
          )}

          {showLocationDropdown && (
            <LocationSuggestionsDropdown
              query={location}
              suggestions={locationSuggestions}
              loading={loadingLocationSuggestions}
              onSelect={selectLocation}
              className="absolute left-0 right-0 top-full z-50 mt-2 sm:left-4 sm:right-4 lg:left-8 lg:right-8"
            />
          )}
        </div>

        {isLanding && (
          <div className="hidden h-12 w-px shrink-0 bg-border sm:block" aria-hidden />
        )}

        {!isLanding && <div className="hidden h-8 w-px bg-border sm:block" />}

        <div ref={experienceAnchorRef} className="relative min-w-0 flex-1">
          {isLanding ? (
            <div className="flex min-w-0 flex-1 flex-col border-b border-border px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">Experience</span>
              <button
                type="button"
                onClick={openExperiencePicker}
                aria-expanded={experienceOpen}
                aria-haspopup="listbox"
                className="mt-1 flex w-full items-center justify-between gap-3 text-left outline-none"
              >
                <span
                  className={`truncate text-sm md:text-base ${
                    experience ? 'text-foreground' : 'text-moons-muted'
                  }`}
                >
                  {experienceLabel || 'Add experience level'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-moons-muted transition-transform ${
                    experienceOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openExperiencePicker}
              aria-expanded={experienceOpen}
              aria-haspopup="listbox"
              aria-label="Experience level"
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left outline-none"
            >
              <span
                className={`truncate text-sm ${
                  experience ? 'text-foreground' : 'text-moons-muted'
                }`}
              >
                {experienceLabel || 'Experience level'}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-moons-muted transition-transform ${
                  experienceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

        </div>

        {mounted &&
          experienceOpen &&
          createPortal(
            <ExperiencePickerDropdown
              value={experience}
              onSelect={selectExperience}
              style={experienceMenuStyle}
              menuRef={experienceMenuRef}
            />,
            document.body,
          )}

        {isLanding ? (
          <button
            type="submit"
            aria-label="Search jobs"
            className="mx-auto mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-moons-blue text-white shadow-[0_4px_16px_rgba(74,127,212,0.35)] transition hover:bg-moons-blue-dark sm:mx-2 sm:mt-0 sm:h-[3.25rem] sm:w-[3.25rem] lg:h-14 lg:w-14"
          >
            <SearchIcon className="h-5 w-5 text-white" />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-1 pb-1 sm:pb-0">
            {showClear && (
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 text-sm font-medium text-moons-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function SearchIcon({ className = 'h-4 w-4 shrink-0 text-moons-muted sm:h-5 sm:w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
