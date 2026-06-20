'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApplicationStatus } from '@moons/shared';
import type { EducationEntry, WorkExperienceEntry } from '@moons/shared';
import { formatExperience, getResumeDisplayName } from '@/components/profile/profile-shared';
import { authFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import type { JobListing } from '@/lib/jobs';
import {
  buildRecruiterCandidatesUrl,
  type RecruiterCandidateFilters,
  type RecruiterCandidateRow,
} from '@/lib/recruiter-candidates';

const STATUS_OPTIONS = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.VIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
] as const;

const NOTICE_OPTIONS = [
  'Immediately',
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months',
  'Serving Notice Period',
];

const EXPERIENCE_BUCKETS = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Fresher', min: 0, max: 0 },
  { label: '1–3 yrs', min: 1, max: 3 },
  { label: '4–6 yrs', min: 4, max: 6 },
  { label: '7–10 yrs', min: 7, max: 10 },
  { label: '10+ yrs', min: 11, max: 99 },
] as const;

function formatApplicationStatus(status: string) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return 'New';
    case ApplicationStatus.VIEWED:
      return 'Viewed';
    case ApplicationStatus.SHORTLISTED:
      return 'Shortlisted';
    case ApplicationStatus.REJECTED:
      return 'Rejected';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case ApplicationStatus.SHORTLISTED:
      return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300';
    case ApplicationStatus.REJECTED:
      return 'bg-red-500/10 text-red-600 ring-red-500/25 dark:text-red-300';
    case ApplicationStatus.VIEWED:
      return 'bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300';
    default:
      return 'bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-200';
  }
}

function formatSalary(ctc: string | null | undefined) {
  if (!ctc?.trim()) return null;
  return ctc.trim();
}

function currentRoleLine(
  profile: NonNullable<RecruiterCandidateRow['candidate']['profile']>,
) {
  const experiences = (profile.workExperiences ?? []) as WorkExperienceEntry[];
  const current = experiences.find((e) => e.isCurrent) ?? experiences[0];
  if (current?.designation && current.company) {
    return `${current.designation} at ${current.company}`;
  }
  if (profile.headline && profile.currentCompany) {
    return `${profile.headline} at ${profile.currentCompany}`;
  }
  if (profile.headline) return profile.headline;
  if (profile.designation && profile.currentCompany) {
    return `${profile.designation} at ${profile.currentCompany}`;
  }
  return profile.currentCompany ?? null;
}

function previousRoleLine(
  profile: NonNullable<RecruiterCandidateRow['candidate']['profile']>,
) {
  const experiences = (profile.workExperiences ?? []) as WorkExperienceEntry[];
  const current = experiences.find((e) => e.isCurrent) ?? experiences[0];
  const previous = experiences.find((e) => e !== current);
  if (!previous) return null;
  if (previous.designation && previous.company) {
    return `${previous.designation} at ${previous.company}`;
  }
  return previous.company ?? null;
}

function educationLine(
  profile: NonNullable<RecruiterCandidateRow['candidate']['profile']>,
) {
  const educations = (profile.educations ?? []) as EducationEntry[];
  const edu = educations[0];
  if (!edu) return null;
  return [edu.degree, edu.institute, edu.year ? `(${edu.year})` : '']
    .filter(Boolean)
    .join(' ');
}

function activeLabel(updatedAt?: string | null) {
  if (!updatedAt) return null;
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / 86_400_000,
  );
  if (days <= 7) return 'Active in last 7 days';
  if (days <= 15) return 'Active in last 15 days';
  if (days <= 30) return 'Active in last 30 days';
  return `Updated ${new Date(updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function SkillChips({ skills, keyword }: { skills: string[]; keyword: string }) {
  const q = keyword.trim().toLowerCase();
  if (skills.length === 0) return <span className="text-moons-muted">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => {
        const match = q && skill.toLowerCase().includes(q);
        return (
          <span
            key={skill}
            className={
              match
                ? 'inline-flex rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-heading ring-1 ring-amber-400/30'
                : 'skill-chip'
            }
          >
            {skill}
          </span>
        );
      })}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-3 border-b border-border/50 py-2.5 last:border-b-0">
      <span className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-moons-muted">
        {label}
      </span>
      <span className="text-sm leading-relaxed text-foreground">{children}</span>
    </div>
  );
}

function CandidateCard({
  row,
  keyword,
  phoneRevealed,
  onRevealPhone,
  updating,
  onStatusChange,
}: {
  row: RecruiterCandidateRow;
  keyword: string;
  phoneRevealed: boolean;
  onRevealPhone: () => void;
  updating: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const profile = row.candidate.profile;
  const name = profile?.fullName ?? row.candidate.email;
  const avatarSrc = resolveAssetUrl(profile?.avatarUrl);
  const resumeUrl = profile?.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = profile ? getResumeDisplayName(profile) : null;
  const exp =
    profile?.experienceYears != null
      ? formatExperience(profile.experienceYears)
      : null;
  const salary = formatSalary(profile?.currentCtc ?? profile?.expectedCtc);
  const skills = profile?.skills ?? [];
  const extraSkills = profile?.preferredIndustries ?? [];
  const profileUpdatedAt =
    profile && 'updatedAt' in profile
      ? (profile as { updatedAt?: string }).updatedAt
      : undefined;

  return (
    <article className="candidate-card">
      <div className="candidate-card-accent" aria-hidden />

      <div className="flex gap-4 px-5 pb-4 pt-5 md:px-6">
        <input
          type="checkbox"
          className="mt-2 h-4 w-4 shrink-0 rounded accent-moons-blue"
          aria-label={`Select ${name}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/recruiter/candidates/${row.candidate.id}`}
                className="text-xl font-bold tracking-tight text-moons-blue transition hover:text-moons-blue-dark hover:underline"
              >
                {name}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                {exp && (
                  <span className="meta-pill">
                    <svg className="h-3.5 w-3.5 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {exp}
                  </span>
                )}
                {salary && (
                  <span className="meta-pill">
                    <span className="text-moons-blue">₹</span>
                    {salary}
                  </span>
                )}
                {profile?.location && (
                  <span className="meta-pill">
                    <svg className="h-3.5 w-3.5 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {profile.location}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(row.status)}`}
            >
              {formatApplicationStatus(row.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="border-t border-border/60 px-5 py-4 md:px-6">
          {profile && (
            <div className="divide-y divide-border/40">
              <DetailRow label="Current">{currentRoleLine(profile) ?? '—'}</DetailRow>
              <DetailRow label="Previous">{previousRoleLine(profile) ?? '—'}</DetailRow>
              <DetailRow label="Education">{educationLine(profile) ?? '—'}</DetailRow>
              <DetailRow label="Locations">
                {profile.preferredLocations?.length
                  ? profile.preferredLocations.join(', ')
                  : profile.location ?? '—'}
              </DetailRow>
              <DetailRow label="Skills">
                <SkillChips skills={skills} keyword={keyword} />
              </DetailRow>
              {extraSkills.length > 0 && (
                <DetailRow label="Industries">{extraSkills.join(', ')}</DetailRow>
              )}
              {profile.noticePeriod && (
                <DetailRow label="Notice">{profile.noticePeriod}</DetailRow>
              )}
              {(profile.currentCtc || profile.expectedCtc) && (
                <DetailRow label="CTC">
                  <span className="font-medium text-heading">{profile.currentCtc ?? '—'}</span>
                  {profile.expectedCtc && (
                    <span className="text-moons-muted"> → {profile.expectedCtc}</span>
                  )}
                </DetailRow>
              )}
            </div>
          )}

          <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-moons-muted">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-moons-blue/10 text-moons-blue">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Applied for{' '}
            <Link
              href={`/recruiter/jobs/${row.job.id}/applicants`}
              className="font-semibold text-moons-blue hover:underline"
            >
              {row.job.title}
            </Link>
            <span>·</span>
            {new Date(row.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-col items-center border-t border-border/60 bg-gradient-to-b from-surface/80 to-surface-elevated px-5 py-5 md:border-l md:border-t-0">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-moons-blue/40 to-moons-navy/20 blur-sm" aria-hidden />
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-surface-elevated bg-surface shadow-md">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-navy to-moons-blue text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {profile?.summary && (
            <p className="mt-4 line-clamp-3 text-center text-xs leading-relaxed text-moons-muted">
              {profile.summary}
            </p>
          )}

          <div className="mt-5 flex w-full flex-col gap-2">
            {profile?.phone ? (
              phoneRevealed ? (
                <>
                  <a
                    href={`tel:${profile.phone}`}
                    className="rounded-xl border border-moons-blue/30 bg-moons-blue/5 px-3 py-2.5 text-center text-sm font-semibold text-moons-blue transition hover:bg-moons-blue/10"
                  >
                    {profile.phone}
                  </a>
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-moons-blue px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call candidate
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onRevealPhone}
                  className="rounded-xl border border-moons-blue/40 bg-surface-elevated px-3 py-2.5 text-sm font-semibold text-moons-blue shadow-sm transition hover:border-moons-blue hover:bg-moons-blue/5"
                >
                  View phone number
                </button>
              )
            ) : (
              <span className="text-center text-xs text-moons-muted">Phone not provided</span>
            )}

            <Link
              href={`/recruiter/candidates/${row.candidate.id}`}
              className="rounded-xl bg-moons-blue px-3 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_14px_rgba(74,127,212,0.35)] transition hover:bg-moons-blue-dark"
            >
              View full profile
            </Link>

            {resumeUrl && resumeFileName && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:bg-surface"
              >
                Download CV
              </a>
            )}

            <select
              value={row.status}
              disabled={updating}
              onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
              className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-heading outline-none transition focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/20 disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {formatApplicationStatus(s)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-moons-muted">
            {profile?.phone ? 'Phone on file' : 'Phone not shared'}
            <br />
            {row.candidate.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-surface/40 px-5 py-2.5 text-[11px] text-moons-muted md:px-6">
        <span>
          {row.job.companyName}
          {row.job.location ? ` · ${row.job.location}` : ''}
        </span>
        <span className="font-medium">{activeLabel(profileUpdatedAt) ?? 'Recently applied'}</span>
      </div>
    </article>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/60 py-4 last:border-b-0">
      <h3 className="text-xs font-bold uppercase tracking-wider text-moons-muted">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function RecruiterCandidatesBrowse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [filters, setFilters] = useState<RecruiterCandidateFilters>({ q: initialQ });
  const [draftQ, setDraftQ] = useState(initialQ);
  const [draftLocation, setDraftLocation] = useState('');
  const [experienceBucket, setExperienceBucket] = useState(0);
  const [statusFilters, setStatusFilters] = useState<ApplicationStatus[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [candidates, setCandidates] = useState<RecruiterCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());

  useEffect(() => {
    authFetch<JobListing[]>('/jobs/mine')
      .then(setJobs)
      .catch(() => setJobs([]));
  }, []);

  const loadCandidates = useCallback(async (active: RecruiterCandidateFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch<RecruiterCandidateRow[]>(
        buildRecruiterCandidatesUrl(active),
      );
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates(filters);
  }, [filters, loadCandidates]);

  const locationOptions = useMemo(() => {
    const locs = new Set<string>();
    candidates.forEach((c) => {
      const loc = c.candidate.profile?.location;
      if (loc) locs.add(loc);
      c.candidate.profile?.preferredLocations?.forEach((l) => locs.add(l));
    });
    return Array.from(locs).sort();
  }, [candidates]);

  const displayed = useMemo(() => {
    if (statusFilters.length === 0) return candidates;
    return candidates.filter((c) => statusFilters.includes(c.status as ApplicationStatus));
  }, [candidates, statusFilters]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.q) n++;
    if (filters.jobId) n++;
    if (filters.location) n++;
    if (filters.noticePeriod) n++;
    if (filters.experienceMin != null || filters.experienceMax != null) {
      if (experienceBucket !== 0) n++;
    }
    if (statusFilters.length) n++;
    return n;
  }, [filters, experienceBucket, statusFilters]);

  function applyFilters() {
    const bucket = EXPERIENCE_BUCKETS[experienceBucket];
    setFilters({
      q: draftQ,
      location: draftLocation || undefined,
      jobId: filters.jobId,
      noticePeriod: filters.noticePeriod,
      experienceMin: bucket.min,
      experienceMax: bucket.max,
    });
  }

  function clearFilters() {
    setDraftQ('');
    setDraftLocation('');
    setExperienceBucket(0);
    setStatusFilters([]);
    setFilters({});
    router.replace('/recruiter/candidates');
  }

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    setError('');
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setCandidates((prev) =>
        prev.map((c) => (c.id === applicationId ? { ...c, status } : c)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-moons-blue">
              Talent pipeline
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-heading md:text-4xl">
              Candidates
            </h1>
            <p className="mt-2 text-sm text-moons-muted">
              {loading ? (
                'Loading your applicant pool…'
              ) : (
                <>
                  <span className="font-semibold text-heading">{displayed.length}</span>
                  {' '}candidate{displayed.length === 1 ? '' : 's'} ready for review
                </>
              )}
            </p>
          </div>
          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 rounded-full bg-moons-blue px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(74,127,212,0.35)] transition hover:bg-moons-blue-dark hover:shadow-[0_6px_20px_rgba(74,127,212,0.45)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="recruiter-filter-panel">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-heading">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-moons-blue/15 px-2 py-0.5 text-[10px] font-bold text-moons-blue">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-moons-blue transition hover:underline"
              >
                Clear all
              </button>
            </div>

            <FilterSection title="Keywords">
              <input
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Skills, role, company…"
                className="space-input rounded-xl"
              />
            </FilterSection>

            <FilterSection title="Job role">
              <select
                value={filters.jobId ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, jobId: e.target.value || undefined }))
                }
                className="space-input rounded-xl"
              >
                <option value="">All posted jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </FilterSection>

            <FilterSection title="Status">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((status) => {
                  const active = statusFilters.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setStatusFilters((prev) =>
                          active ? prev.filter((s) => s !== status) : [...prev, status],
                        )
                      }
                      className={active ? 'filter-chip filter-chip-active' : 'filter-chip'}
                    >
                      {formatApplicationStatus(status)}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection title="Experience">
              <div className="flex flex-wrap gap-1.5">
                {EXPERIENCE_BUCKETS.map((bucket, i) => (
                  <button
                    key={bucket.label}
                    type="button"
                    onClick={() => setExperienceBucket(i)}
                    className={
                      experienceBucket === i ? 'filter-chip filter-chip-active' : 'filter-chip'
                    }
                  >
                    {bucket.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Location">
              <input
                type="text"
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                placeholder="City or state"
                className="space-input rounded-xl"
              />
              {locationOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {locationOptions.slice(0, 6).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDraftLocation(loc)}
                      className={
                        draftLocation === loc ? 'filter-chip filter-chip-active' : 'filter-chip'
                      }
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </FilterSection>

            <FilterSection title="Notice period">
              <select
                value={filters.noticePeriod ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    noticePeriod: e.target.value || undefined,
                  }))
                }
                className="space-input rounded-xl"
              >
                <option value="">Any notice period</option>
                {NOTICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FilterSection>

            <button
              type="button"
              onClick={applyFilters}
              className="mt-2 w-full rounded-xl bg-moons-blue py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(74,127,212,0.3)] transition hover:bg-moons-blue-dark"
            >
              Apply filters
            </button>
          </aside>

          <main className="min-w-0 space-y-5">
            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="candidate-card overflow-hidden p-6">
                  <div className="candidate-card-accent mb-5 opacity-50" />
                  <div className="h-6 w-1/3 animate-pulse rounded-lg bg-surface" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-7 w-20 animate-pulse rounded-full bg-surface" />
                    <div className="h-7 w-24 animate-pulse rounded-full bg-surface" />
                  </div>
                  <div className="mt-6 h-4 w-2/3 animate-pulse rounded bg-surface" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
                </div>
              ))
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-moons-blue/30 bg-surface-elevated/50 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-moons-blue/10 text-moons-blue">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="mt-5 text-lg font-bold text-heading">No candidates found</p>
                <p className="mt-2 max-w-sm text-sm text-moons-muted">
                  Adjust your filters or post a new job to start building your talent pool.
                </p>
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-6 inline-flex rounded-full bg-moons-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark"
                >
                  Post a Job
                </Link>
              </div>
            ) : (
              displayed.map((row) => (
                <CandidateCard
                  key={row.id}
                  row={row}
                  keyword={filters.q ?? ''}
                  phoneRevealed={revealedPhones.has(row.candidate.id)}
                  onRevealPhone={() =>
                    setRevealedPhones((prev) => new Set(prev).add(row.candidate.id))
                  }
                  updating={updatingId === row.id}
                  onStatusChange={(status) => updateStatus(row.id, status)}
                />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
