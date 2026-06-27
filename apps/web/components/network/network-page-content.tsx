'use client';

import { UserRole } from '@moons/shared';
import { useCallback, useEffect, useState } from 'react';
import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';
import {
  fetchRecentConnections,
  fetchSuggestions,
  searchProfessionals,
  type ConnectionListItem,
} from '@/lib/network';
import type { NetworkUserCard } from '@moons/shared';

const TABS = [
  { id: 'suggestions', label: 'People Who Can Help', short: 'Suggestions' },
  { id: 'recent', label: 'Recently Connected', short: 'Recent' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M14 14l3 3" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="7.5" cy="6.5" r="2.5" />
      <path d="M2.5 16.5c0-2.5 2.2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" />
      <path d="M17.5 16.5c0-2-1.6-3.5-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function applyConnectionUpdate(
  list: NetworkUserCard[],
  userId: string,
  update: ConnectionUpdate,
): NetworkUserCard[] {
  return list.map((person) =>
    person.userId === userId
      ? {
          ...person,
          connectionStatus: update.connectionStatus,
          connectionId: update.connectionId || null,
          connectionDirection: update.connectionDirection,
        }
      : person,
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-moons-navy/90 text-white shadow-md shadow-moons-navy/15'
          : 'text-moons-muted hover:bg-surface-elevated/80 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function NetworkPageContent({ initialTab = 'suggestions' }: { initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab === 'recent' ? 'recent' : 'suggestions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<NetworkUserCard[]>([]);
  const [recent, setRecent] = useState<ConnectionListItem[]>([]);
  const [searchResults, setSearchResults] = useState<NetworkUserCard[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searching, setSearching] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSkills, setSearchSkills] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchOpenToWork, setSearchOpenToWork] = useState(false);
  const [searchHiring, setSearchHiring] = useState(false);

  const loadTab = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'suggestions') {
        const data = await fetchSuggestions();
        setSuggestions(data.items);
      } else {
        setRecent(await fetchRecentConnections());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!searchActive) {
      loadTab();
    }
  }, [loadTab, searchActive]);

  function handleLocalConnectionChange(userId: string, update: ConnectionUpdate) {
    setSuggestions((prev) => applyConnectionUpdate(prev, userId, update));
    setSearchResults((prev) => applyConnectionUpdate(prev, userId, update));
  }

  function handleDismissCard(userId: string) {
    setSuggestions((prev) => prev.filter((p) => p.userId !== userId));
    setSearchResults((prev) => prev.filter((p) => p.userId !== userId));
  }

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setSearching(true);
    setSearchActive(true);
    setError('');
    try {
      const data = await searchProfessionals({
        q: searchQuery,
        skills: searchSkills,
        location: searchLocation,
        role: searchRole,
        ...(searchOpenToWork ? { openToWork: true } : {}),
        ...(searchHiring ? { isHiring: true } : {}),
      });
      setSearchResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchActive(false);
    setSearchResults([]);
    setSearchQuery('');
    setSearchSkills('');
    setSearchLocation('');
    setSearchRole('');
    setSearchOpenToWork(false);
    setSearchHiring(false);
  }

  const activeTabMeta = TABS.find((t) => t.id === tab);
  const resultCount = searchActive
    ? searchResults.length
    : tab === 'suggestions'
      ? suggestions.length
      : recent.length;

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero — open layout, no boxed container */}
        <div className="relative mb-10">
          <div
            className="pointer-events-none absolute -left-8 top-0 h-48 w-48 rounded-full bg-moons-blue/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-8 h-32 w-32 rounded-full bg-moons-blue/5 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-moons-blue to-moons-navy text-white shadow-lg shadow-moons-blue/30">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-script text-3xl text-moons-blue">My Network</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                Build meaningful professional relationships
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-moons-muted">
                Connect with recruiters, mentors, and professionals who can help advance your career.
              </p>
            </div>
          </div>
        </div>

        {/* Search — soft floating panel */}
        <form
          onSubmit={runSearch}
          className="mb-10 rounded-[1.75rem] bg-surface-elevated/90 p-6 shadow-[0_8px_40px_rgba(26,39,68,0.07)] backdrop-blur-sm sm:p-7"
        >
          <div className="mb-5">
            <p className="text-sm font-semibold text-heading">Discover professionals</p>
            <p className="mt-0.5 text-xs text-moons-muted">Search by name, skills, location, or hiring status</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moons-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, headline, company…"
                  className="w-full rounded-2xl border-0 bg-surface/80 py-3 pl-11 pr-4 text-sm text-foreground shadow-inner shadow-black/[0.03] outline-none ring-1 ring-border/40 transition placeholder:text-moons-muted focus:ring-2 focus:ring-moons-blue/30"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-moons-navy to-moons-blue px-8 text-sm font-semibold text-white shadow-lg shadow-moons-navy/20 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-moons-muted/80">
                  Skills
                </label>
                <input
                  value={searchSkills}
                  onChange={(e) => setSearchSkills(e.target.value)}
                  placeholder="e.g. React, Python"
                  className="w-full rounded-2xl border-0 bg-surface/60 py-2.5 px-3.5 text-sm outline-none ring-1 ring-border/30 focus:ring-2 focus:ring-moons-blue/25"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-moons-muted/80">
                  Location
                </label>
                <input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="City or region"
                  className="w-full rounded-2xl border-0 bg-surface/60 py-2.5 px-3.5 text-sm outline-none ring-1 ring-border/30 focus:ring-2 focus:ring-moons-blue/25"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-moons-muted/80">
                  Role
                </label>
                <select
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  className="w-full rounded-2xl border-0 bg-surface/60 py-2.5 px-3.5 text-sm outline-none ring-1 ring-border/30 focus:ring-2 focus:ring-moons-blue/25"
                >
                  <option value="">All roles</option>
                  <option value={UserRole.CANDIDATE}>Candidates</option>
                  <option value={UserRole.RECRUITER}>Recruiters</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={searchOpenToWork} onClick={() => setSearchOpenToWork((v) => !v)}>
                Open to work
              </FilterPill>
              <FilterPill active={searchHiring} onClick={() => setSearchHiring((v) => !v)}>
                Hiring
              </FilterPill>
            </div>
          </div>
        </form>

        {/* Tabs — pill strip, no outer box */}
        {!searchActive && (
          <div className="mb-6 inline-flex rounded-full bg-surface/70 p-1 shadow-sm backdrop-blur-sm">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  tab === item.id
                    ? 'bg-surface-elevated text-heading shadow-md shadow-black/[0.04]'
                    : 'text-moons-muted hover:text-foreground'
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {searchActive ? (
              <p className="text-sm font-semibold text-heading">Search results</p>
            ) : (
              activeTabMeta && (
                <p className="text-sm font-semibold text-heading">{activeTabMeta.label}</p>
              )
            )}
            {!loading && !searching && (
              <span className="rounded-full bg-moons-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-moons-blue">
                {resultCount}
              </span>
            )}
          </div>
          {searchActive && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-moons-blue transition hover:bg-moons-blue/10"
            >
              Clear search
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading && !searchActive ? (
          <LoadingGrid />
        ) : searching ? (
          <LoadingGrid />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchActive
              ? searchResults.map((person) => (
                  <PersonCard
                    key={person.userId}
                    variant="discovery"
                    person={person}
                    onConnectionChange={handleLocalConnectionChange}
                    onDismiss={() => handleDismissCard(person.userId)}
                  />
                ))
              : tab === 'suggestions'
                ? suggestions.map((person) => (
                    <PersonCard
                      key={person.userId}
                      variant="discovery"
                      person={person}
                      onConnectionChange={handleLocalConnectionChange}
                      onDismiss={() => handleDismissCard(person.userId)}
                    />
                  ))
                : recent.map((item) => (
                    <PersonCard
                      key={item.connectionId}
                      variant="network"
                      person={{
                        ...item.user,
                        connectionStatus: 'ACCEPTED',
                        connectionId: item.connectionId,
                      }}
                      onUpdated={loadTab}
                    />
                  ))}
          </div>
        )}

        {!loading && !searching && searchActive && searchResults.length === 0 && (
          <EmptyState
            title="No matches found"
            message="Try different keywords or loosen your filters."
          />
        )}
        {!loading && !searchActive && tab === 'suggestions' && suggestions.length === 0 && (
          <EmptyState
            title="No suggestions yet"
            message="Complete your profile and add skills to get smarter recommendations."
          />
        )}
        {!loading && !searchActive && tab === 'recent' && recent.length === 0 && (
          <EmptyState title="No recent connections" message="People you connect with will appear here." />
        )}
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[1.75rem] bg-surface-elevated/80 shadow-[0_8px_30px_rgba(26,39,68,0.06)]"
        >
          <div className="flex flex-col items-center px-4 pb-4 pt-10">
            <div className="h-16 w-16 rounded-full bg-surface" />
            <div className="mt-4 h-3 w-24 rounded-full bg-surface" />
            <div className="mt-2 h-2 w-32 rounded-full bg-surface" />
          </div>
          <div className="p-4 pt-2">
            <div className="h-10 rounded-full bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-6 px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moons-blue/10">
        <UsersIcon className="h-7 w-7 text-moons-blue" />
      </div>
      <p className="mt-5 text-base font-semibold text-heading">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-moons-muted">{message}</p>
    </div>
  );
}
