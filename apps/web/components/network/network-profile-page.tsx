'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { resolveAvatarUrl, resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import {
  acceptConnection,
  cancelConnection,
  fetchNetworkProfile,
  rejectConnection,
  removeConnection,
  sendConnectionRequest,
  type NetworkProfileResponse,
} from '@/lib/network';
import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';

function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-surface-elevated/95 p-5 shadow-[0_4px_24px_rgba(26,39,68,0.05)] sm:p-6">
      <h2 className="text-sm font-bold text-heading">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        accent
          ? 'bg-moons-blue/10 text-moons-blue'
          : 'bg-surface text-foreground ring-1 ring-border/40'
      }`}
    >
      {children}
    </span>
  );
}

function PlaceholderButton({
  label,
  icon,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        primary
          ? 'bg-gradient-to-r from-moons-navy to-moons-blue text-white opacity-90 shadow-md shadow-moons-navy/15'
          : 'bg-surface text-foreground ring-1 ring-border/50 opacity-80'
      } cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}

function MessageIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 5.5A2.5 2.5 0 015.5 3h9A2.5 2.5 0 0117 5.5v6A2.5 2.5 0 0114.5 14H8l-4 3v-3H5.5A2.5 2.5 0 013 11.5v-6z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 4.5h12v8H8l-3 2.5V12.5H4v-8z" />
      <path d="M7 8.5h6M7 11h4" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 4.5l2 2-2 2M6 10.5h10M6 4.5l-2 2 2 2M6 15.5l-2-2 2-2M14 13.5l2-2-2-2" strokeLinecap="round" />
    </svg>
  );
}

function ProfileActionBar({
  userId,
  connectionStatus,
  connectionId,
  connectionDirection,
  onUpdated,
}: {
  userId: string;
  connectionStatus: string;
  connectionId: string | null;
  connectionDirection: 'sent' | 'received' | null;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<unknown>, refresh = true) {
    setLoading(true);
    setError('');
    try {
      await action();
      if (refresh) onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  if (connectionStatus === 'ACCEPTED') {
    return (
      <div className="w-full sm:w-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
          <PlaceholderButton label="Message" icon={<MessageIcon />} primary />
          <PlaceholderButton label="Chat" icon={<ChatIcon />} />
          <PlaceholderButton label="Share" icon={<ShareIcon />} />
          <button
            type="button"
            disabled={loading}
            onClick={() => run(() => removeConnection(userId))}
            className="rounded-full px-4 py-2 text-sm font-semibold text-moons-muted transition hover:bg-surface hover:text-foreground disabled:opacity-60"
          >
            Remove
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionDirection === 'received' && connectionId) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => acceptConnection(connectionId))}
          className="rounded-full bg-gradient-to-r from-moons-navy to-moons-blue px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => rejectConnection(connectionId))}
          className="rounded-full bg-surface px-5 py-2 text-sm font-semibold text-foreground ring-1 ring-border/50 disabled:opacity-60"
        >
          Decline
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800">
          Request pending
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => cancelConnection(connectionId))}
          className="rounded-full bg-surface px-5 py-2 text-sm font-semibold text-foreground ring-1 ring-border/50 disabled:opacity-60"
        >
          Cancel request
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(() => sendConnectionRequest(userId))}
        className="rounded-full bg-gradient-to-r from-moons-navy to-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-moons-navy/20 disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Connect'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function normalizeConnectionStatus(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'REJECTED' || normalized === 'CANCELLED') return 'NONE';
  return normalized;
}

export function NetworkProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();
  const [data, setData] = useState<NetworkProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    return fetchNetworkProfile(userId).then(setData);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNetworkProfile(userId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Profile unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-moons-muted">Loading profile…</div>;
  }

  if (error || !data) {
    return (
      <div className="dash-page p-8 text-center">
        <p className="text-sm text-red-600">{error || 'Profile not found'}</p>
        <Link href="/network" className="mt-4 inline-block text-sm text-moons-blue hover:underline">
          ← Back to My Network
        </Link>
      </div>
    );
  }

  const { profile } = data;
  const limited = Boolean(profile.limited);
  const avatar = resolveAvatarUrl(profile.avatarUrl as string | null);
  const bannerUrl = profile.bannerUrl ? String(profile.bannerUrl) : null;

  const workExperiences = parseArray<WorkExperienceEntry>(profile.workExperiences);
  const educations = parseArray<EducationEntry>(profile.educations);
  const certifications = parseArray<CertificationEntry>(profile.certifications);
  const skills = Array.isArray(profile.skills) ? (profile.skills as string[]) : [];
  const careerGoals = Array.isArray(profile.careerGoals) ? (profile.careerGoals as string[]) : [];
  const interests = Array.isArray(profile.professionalInterests)
    ? (profile.professionalInterests as string[])
    : [];
  const preferredRoles = Array.isArray(profile.preferredRoles) ? (profile.preferredRoles as string[]) : [];
  const preferredLocations = Array.isArray(profile.preferredLocations)
    ? (profile.preferredLocations as string[])
    : [];
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(String(profile.resumeUrl)) : null;
  const isOwnProfile = user?.id === profile.userId;
  const connectionStatus = normalizeConnectionStatus(data.connectionStatus);

  const metaLine = [
    profile.currentCompany,
    profile.location,
    profile.experienceYears != null ? `${profile.experienceYears}+ yrs exp` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/network" className="text-sm font-medium text-moons-blue hover:underline">
          ← My Network
        </Link>
        {isOwnProfile && (
          <p className="mt-2 text-xs text-moons-muted">
            This is your public profile. Use <strong className="font-semibold text-foreground">Add cover photo</strong> on the banner, or{' '}
            <Link href="/profile" className="font-medium text-moons-blue hover:underline">
              edit your full profile
            </Link>
            .
          </p>
        )}

        <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-surface-elevated/95 shadow-[0_8px_40px_rgba(26,39,68,0.08)]">
          <CoverPhotoBanner
            bannerUrl={bannerUrl}
            updatedAt={profile.updatedAt ? String(profile.updatedAt) : null}
            editable={isOwnProfile}
            onUpdated={(nextBannerUrl, updatedAt) => {
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      profile: {
                        ...prev.profile,
                        bannerUrl: nextBannerUrl,
                        updatedAt,
                      },
                    }
                  : prev,
              );
            }}
          />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
                <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated text-3xl font-bold text-moons-navy shadow-lg ring-4 ring-surface-elevated sm:mx-0 sm:h-28 sm:w-28">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile.fullName ?? '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-center sm:pb-1 sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-2xl font-bold text-heading">{profile.fullName}</h1>
                    {profile.openToWork && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Open to work
                      </span>
                    )}
                    {profile.isHiring && (
                      <span className="rounded-full bg-moons-blue px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Hiring
                      </span>
                    )}
                  </div>
                  {profile.headline && (
                    <p className="mt-1 text-sm text-foreground">{profile.headline}</p>
                  )}
                  {metaLine && <p className="mt-1 text-xs text-moons-muted">{metaLine}</p>}
                  <p className="mt-2 text-xs text-moons-muted">
                    {data.connectionCount} connections
                    {data.mutualConnections.count > 0 &&
                      ` · ${data.mutualConnections.count} mutual`}
                  </p>
                </div>
              </div>

              {!limited && !isOwnProfile && (
                <ProfileActionBar
                  userId={profile.userId}
                  connectionStatus={connectionStatus}
                  connectionId={data.connectionId}
                  connectionDirection={data.connectionDirection}
                  onUpdated={reload}
                />
              )}
            </div>
          </div>
        </div>

        {limited ? (
          <div className="mt-5 rounded-[1.25rem] bg-surface-elevated/95 p-6 text-sm text-moons-muted shadow-[0_4px_24px_rgba(26,39,68,0.05)]">
            This profile is private or visible to connections only.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              {Boolean(profile.summary) && (
                <SectionCard title="About">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {String(profile.summary)}
                  </p>
                </SectionCard>
              )}

              {workExperiences.length > 0 && (
                <SectionCard title="Experience">
                  <div className="space-y-4">
                    {workExperiences.map((exp, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-surface ring-1 ring-border/40" />
                        <div>
                          <p className="font-semibold text-heading">{exp.designation}</p>
                          <p className="text-sm text-foreground">{exp.company}</p>
                          <p className="mt-0.5 text-xs text-moons-muted">
                            {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                          </p>
                          {exp.description && (
                            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {educations.length > 0 && (
                <SectionCard title="Education">
                  <div className="space-y-3">
                    {educations.map((edu, i) => (
                      <div key={i}>
                        <p className="font-semibold text-heading">
                          {edu.degree}
                          {edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ''}
                        </p>
                        <p className="text-sm text-moons-muted">
                          {edu.institute} · {edu.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {skills.length > 0 && (
                <SectionCard title="Skills">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Chip key={skill}>{skill}</Chip>
                    ))}
                  </div>
                </SectionCard>
              )}

              {data.sharedSkills.length > 0 && (
                <SectionCard title="Shared skills">
                  <div className="flex flex-wrap gap-2">
                    {data.sharedSkills.map((skill) => (
                      <Chip key={skill} accent>
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </SectionCard>
              )}

              {certifications.length > 0 && (
                <SectionCard title="Licenses & certifications">
                  <div className="space-y-3">
                    {certifications.map((cert, i) => (
                      <div key={i}>
                        <p className="font-semibold text-heading">{cert.name}</p>
                        <p className="text-sm text-moons-muted">
                          {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {data.mutualConnections.items.length > 0 && (
                <SectionCard title="Mutual connections">
                  <div className="space-y-2">
                    {data.mutualConnections.items.map((person) => (
                      <Link
                        key={person.userId}
                        href={`/network/${person.userId}`}
                        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-bold text-moons-muted ring-1 ring-border/40">
                          {(person.fullName ?? '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-heading">{person.fullName}</p>
                          <p className="text-xs text-moons-muted">{person.headline}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <SectionCard title="Contact & links">
                <dl className="space-y-3 text-sm">
                  {profile.email && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                        Email
                      </dt>
                      <dd className="mt-0.5 text-foreground">{String(profile.email)}</dd>
                    </div>
                  )}
                  {profile.phone && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                        Phone
                      </dt>
                      <dd className="mt-0.5 text-foreground">{String(profile.phone)}</dd>
                    </div>
                  )}
                  {profile.linkedinUrl && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                        LinkedIn
                      </dt>
                      <dd className="mt-0.5 truncate text-moons-blue">{String(profile.linkedinUrl)}</dd>
                    </div>
                  )}
                  {profile.githubUrl && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                        GitHub
                      </dt>
                      <dd className="mt-0.5 truncate text-moons-blue">{String(profile.githubUrl)}</dd>
                    </div>
                  )}
                  {profile.personalWebsiteUrl && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
                        Website
                      </dt>
                      <dd className="mt-0.5 truncate text-moons-blue">
                        {String(profile.personalWebsiteUrl)}
                      </dd>
                    </div>
                  )}
                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-moons-blue/10 px-4 py-2 text-xs font-semibold text-moons-blue"
                    >
                      View resume
                    </a>
                  )}
                </dl>
              </SectionCard>

              {(careerGoals.length > 0 || interests.length > 0) && (
                <SectionCard title="Interests & goals">
                  {interests.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold text-moons-muted">Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((item) => (
                          <Chip key={item}>{item}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {careerGoals.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-moons-muted">Career goals</p>
                      <div className="flex flex-wrap gap-1.5">
                        {careerGoals.map((item) => (
                          <Chip key={item}>{item}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              {(preferredRoles.length > 0 || preferredLocations.length > 0) && (
                <SectionCard title="Open to">
                  <div className="space-y-2 text-sm text-foreground">
                    {preferredRoles.length > 0 && (
                      <p>
                        <span className="font-semibold text-heading">Roles: </span>
                        {preferredRoles.join(', ')}
                      </p>
                    )}
                    {preferredLocations.length > 0 && (
                      <p>
                        <span className="font-semibold text-heading">Locations: </span>
                        {preferredLocations.join(', ')}
                      </p>
                    )}
                  </div>
                </SectionCard>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
