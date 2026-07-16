'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { NetworkUserCard } from '@moons/shared';
import { ApplicationStatus } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';
import { fetchSuggestions } from '@/lib/network';
import {
  buildRecruiterCandidatesUrl,
  type RecruiterCandidateRow,
} from '@/lib/recruiter-candidates';

function SectionShell({
  eyebrow,
  title,
  href,
  linkLabel = 'See all',
  children,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-script text-xl text-moons-blue">{eyebrow}</p>
          <h3 className="text-base font-bold text-heading">{title}</h3>
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-moons-blue hover:underline">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function PeopleYouMayKnowSection() {
  const [people, setPeople] = useState<NetworkUserCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchSuggestions(1, 6);
      setPeople(data.items);
    } catch {
      if (!opts?.silent) setPeople([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    function onRefresh() {
      void load({ silent: true });
    }
    window.addEventListener('moons:connections-refresh', onRefresh);
    window.addEventListener('moons:notifications-refresh', onRefresh);
    return () => {
      window.removeEventListener('moons:connections-refresh', onRefresh);
      window.removeEventListener('moons:notifications-refresh', onRefresh);
    };
  }, [load]);

  function handleConnectionChange(userId: string, update: ConnectionUpdate) {
    if (
      update.connectionStatus === 'ACCEPTED' ||
      update.connectionStatus === 'NONE' ||
      update.connectionStatus === 'REJECTED'
    ) {
      setPeople((prev) => prev.filter((p) => p.userId !== userId));
      return;
    }
    setPeople((prev) =>
      prev.map((person) =>
        person.userId === userId
          ? {
              ...person,
              connectionStatus: update.connectionStatus,
              connectionId: update.connectionId || null,
              connectionDirection: update.connectionDirection,
            }
          : person,
      ),
    );
  }

  return (
    <SectionShell
      eyebrow="Network"
      title="People you may know"
      href="/network?tab=suggestions"
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-moons-muted">Loading suggestions…</p>
      ) : people.length === 0 ? (
        <p className="py-6 text-center text-sm text-moons-muted">
          No suggestions yet.{' '}
          <Link href="/network?tab=search" className="text-moons-blue hover:underline">
            Search professionals
          </Link>
        </p>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {people.map((person) => (
            <div key={person.userId} className="w-[240px] shrink-0">
              <PersonCard
                person={person}
                variant="discovery"
                onConnectionChange={handleConnectionChange}
                onDismiss={() =>
                  setPeople((prev) => prev.filter((p) => p.userId !== person.userId))
                }
              />
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function RecruiterCandidatesSection() {
  const [candidates, setCandidates] = useState<RecruiterCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch<RecruiterCandidateRow[]>(
      buildRecruiterCandidatesUrl({ status: ApplicationStatus.SUBMITTED }),
    )
      .then((rows) => {
        const seen = new Set<string>();
        const unique: RecruiterCandidateRow[] = [];
        for (const row of rows) {
          if (seen.has(row.candidate.id)) continue;
          seen.add(row.candidate.id);
          unique.push(row);
          if (unique.length >= 4) break;
        }
        setCandidates(unique);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionShell
      eyebrow="Talent"
      title="Candidates for your roles"
      href="/recruiter/candidates"
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-moons-muted">Loading candidates…</p>
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-moons-muted">
          No new applicants yet.{' '}
          <Link href="/recruiter/jobs/new" className="text-moons-blue hover:underline">
            Post a job
          </Link>
        </p>
      ) : (
        <div className="space-y-2">
          {candidates.map((row) => {
            const profile = row.candidate.profile;
            const name = profile?.fullName?.trim() || row.candidate.email.split('@')[0];
            const avatar = resolveAssetUrl(profile?.avatarUrl);
            const experience =
              profile?.experienceYears != null
                ? profile.experienceYears === 0
                  ? 'Fresher'
                  : `${profile.experienceYears} yrs exp`
                : null;

            return (
              <Link
                key={row.id}
                href={`/recruiter/candidates/${row.candidate.id}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-moons-blue/30 hover:bg-moons-blue/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-bold text-heading">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading">{name}</p>
                  <p className="truncate text-xs text-moons-muted">
                    {row.job.title}
                    {profile?.location ? ` · ${profile.location}` : ''}
                    {experience ? ` · ${experience}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-moons-blue/10 px-2 py-0.5 text-[10px] font-semibold text-moons-blue">
                  New
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
