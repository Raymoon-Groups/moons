'use client';

import Link from 'next/link';
import { UserRole } from '@moons/shared';
import { useCallback, useEffect, useState } from 'react';
import { DashPageHero } from '@/components/dash/dash-page-shell';
import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';
import { useAuth } from '@/lib/auth-context';
import { OPEN_ON_MOONS_LABEL } from '@/lib/open-on-moons';
import {
  fetchRecentConnections,
  fetchSuggestions,
  searchProfessionals,
  type ConnectionListItem,
} from '@/lib/network';
import type { NetworkUserCard } from '@moons/shared';

const TABS = [
  { id: 'suggestions', label: 'People you may know', short: 'Suggestions' },
  { id: 'recent', label: 'Recently connected', short: 'Recent' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PAGE_BG = 'li-page-bg';
const PANEL =
  'overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-[0_4px_24px_rgba(26,39,68,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.28)]';

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
          ? 'bg-moons-blue text-white shadow-sm ring-1 ring-moons-blue/30'
          : 'bg-surface text-moons-muted ring-1 ring-border/60 hover:bg-surface-hover hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function TabPill({
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-moons-blue text-white shadow-sm'
          : 'text-moons-muted hover:bg-surface hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function NetworkPageContent({ initialTab = 'suggestions' }: { initialTab?: TabId }) {
  const { user } = useAuth();
  const isRecruiter = user?.role === UserRole.RECRUITER;
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

  const heroSubtitle = isRecruiter
    ? 'Discover talent and build your professional network. Search by skills, location, or who is Open on Moons.'
    : 'Connect with professionals who share your skills and industry. Grow relationships that open doors.';

  return (
    <div className={PAGE_BG}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <DashPageHero
          eyebrow="Connections"
          eyebrowIcon={<UsersIcon className="h-3.5 w-3.5" />}
          title="My Network"
          subtitle={heroSubtitle}
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0 space-y-4">
            {/* Search */}
            <form onSubmit={runSearch} className={`${PANEL} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-heading">Search professionals</p>
                  <p className="mt-0.5 text-xs text-moons-muted">
                    {isRecruiter
                      ? 'Find candidates by name, skills, location, or availability'
                      : 'Name, skills, location, or hiring status'}
                  </p>
                </div>
                {searchActive && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="shrink-0 rounded-full border border-border/80 px-3 py-1 text-xs font-semibold text-moons-blue transition hover:border-moons-blue/30 hover:bg-moons-blue/5"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-moons-muted" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or headline"
                      className="space-input h-11 w-full pl-10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="h-11 shrink-0 rounded-full bg-moons-blue px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-60"
                  >
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={searchSkills}
                    onChange={(e) => setSearchSkills(e.target.value)}
                    placeholder="Skills"
                    className="space-input h-10"
                  />
                  <input
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Location"
                    className="space-input h-10"
                  />
                  <select
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    className="space-input h-10"
                  >
                    <option value="">All roles</option>
                    <option value={UserRole.CANDIDATE}>Candidates</option>
                    <option value={UserRole.RECRUITER}>Recruiters</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isRecruiter && (
                    <FilterPill active={searchOpenToWork} onClick={() => setSearchOpenToWork((v) => !v)}>
                      {OPEN_ON_MOONS_LABEL}
                    </FilterPill>
                  )}
                  <FilterPill active={searchHiring} onClick={() => setSearchHiring((v) => !v)}>
                    Hiring
                  </FilterPill>
                </div>
              </div>
            </form>

            {/* Results */}
            <div className={PANEL}>
              <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                {!searchActive ? (
                  <div className="flex flex-wrap gap-1.5">
                    {TABS.map((item) => (
                      <TabPill key={item.id} active={tab === item.id} onClick={() => setTab(item.id)}>
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.short}</span>
                      </TabPill>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-heading">Search results</p>
                )}

                <div className="flex items-center gap-2">
                  {!loading && !searching && (
                    <span className="rounded-full bg-moons-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-moons-blue">
                      {resultCount} {resultCount === 1 ? 'person' : 'people'}
                    </span>
                  )}
                  {!searchActive && activeTabMeta && (
                    <span className="hidden text-xs text-moons-muted sm:inline">{activeTabMeta.label}</span>
                  )}
                </div>
              </div>

              {error && (
                <p className="mx-4 mt-4 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:mx-5">
                  {error}
                </p>
              )}

              <div className="p-4 sm:p-5">
                {loading && !searchActive ? (
                  <LoadingGrid />
                ) : searching ? (
                  <LoadingGrid />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    message={
                      isRecruiter
                        ? 'Try different keywords, loosen filters, or browse suggestions.'
                        : 'Try different keywords or loosen your filters.'
                    }
                  />
                )}
                {!loading && !searchActive && tab === 'suggestions' && suggestions.length === 0 && (
                  <EmptyState
                    title="No suggestions yet"
                    message="Add skills and experience to your profile for better recommendations."
                    action={{ href: '/profile', label: 'Complete your profile' }}
                  />
                )}
                {!loading && !searchActive && tab === 'recent' && recent.length === 0 && (
                  <EmptyState
                    title="No recent connections"
                    message="People you connect with will appear here."
                    action={{ href: '/network', label: 'Browse suggestions' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
            <div className="dash-tips-card">
              <h2 className="text-sm font-bold text-heading">
                {isRecruiter ? 'Recruiter tips' : 'Grow your network'}
              </h2>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-moons-muted">
                {isRecruiter ? (
                  <>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Use the {OPEN_ON_MOONS_LABEL} filter to find candidates actively open to opportunities
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Search by skills and location to narrow your talent pool
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Add a personal note when connecting — it appears in their inbox
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Connect with people who share your skills or industry
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Add a personal note when sending invitations
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
                      Mutual connections make great introductions
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="dash-sidebar-card">
              <h2 className="text-sm font-bold text-heading">Invitation notes</h2>
              <p className="mt-2 text-xs leading-relaxed text-moons-muted">
                Notes you send with Connect appear in the recipient&apos;s{' '}
                <Link href="/messages" className="font-semibold text-moons-blue hover:underline">
                  Messaging
                </Link>{' '}
                inbox. Accept or ignore invites from your notifications or inbox.
              </p>
            </div>

            <div className="dash-sidebar-card">
              <h2 className="text-sm font-bold text-heading">
                {isRecruiter ? 'Find the right fit' : 'Profile tip'}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-moons-muted">
                {isRecruiter
                  ? 'Candidates with complete profiles — skills, experience, and a cover photo — are easier to evaluate and more likely to respond.'
                  : 'A complete profile with skills, experience, and a cover photo helps you appear in more relevant suggestions.'}
              </p>
              {!isRecruiter && (
                <Link
                  href="/profile"
                  className="mt-3 inline-flex text-xs font-semibold text-moons-blue hover:underline"
                >
                  Edit your profile →
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-border/70 bg-surface-elevated shadow-sm"
        >
          <div className="h-14 bg-gradient-to-r from-moons-blue/10 to-transparent" />
          <div className="flex flex-col items-center px-4 pb-5 pt-0">
            <div className="-mt-8 h-16 w-16 rounded-full bg-surface ring-4 ring-surface-elevated" />
            <div className="mt-4 h-3 w-28 rounded-full bg-surface" />
            <div className="mt-2 h-2.5 w-36 rounded-full bg-surface" />
            <div className="mt-5 h-9 w-full rounded-full bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-moons-blue/10 text-moons-blue">
        <UsersIcon className="h-7 w-7" />
      </div>
      <p className="mt-4 text-base font-semibold text-heading">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-moons-muted">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
