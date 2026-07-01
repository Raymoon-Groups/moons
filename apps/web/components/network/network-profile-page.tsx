'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { resolveAvatarUrl, resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { OPEN_ON_MOONS_LABEL, showOpenOnMoonsToViewer } from '@/lib/open-on-moons';
import {
  acceptConnection,
  cancelConnection,
  fetchNetworkProfile,
  rejectConnection,
  removeConnection,
  type NetworkProfileResponse,
} from '@/lib/network';
import {
  ConnectInviteModal,
  MessageComposeModal,
  ShareProfileMenu,
} from '@/components/network/network-modals';
import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';

function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const PROFILE_CARD =
  'overflow-hidden rounded-lg border border-border/80 bg-surface-elevated shadow-sm';

function SectionCard({
  title,
  subtitle,
  children,
  compact,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`${PROFILE_CARD} ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <header className="border-b border-border/50 pb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-heading sm:text-base">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-moons-muted">{subtitle}</p>}
      </header>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function LiButton({
  children,
  variant = 'outline',
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55';
  const styles = {
    primary: `${base} bg-moons-navy text-white hover:bg-moons-blue-dark`,
    outline: `${base} border border-border bg-surface-elevated text-heading hover:bg-surface hover:border-moons-muted/40`,
    ghost: `${base} text-moons-muted hover:bg-surface hover:text-heading`,
  };
  return (
    <button type="button" disabled={disabled} onClick={onClick} title={title} className={styles[variant]}>
      {children}
    </button>
  );
}

function MessageIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 10h8v1.5H8V10zm0 3.5h5V15H8v-1.5zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2v.5l-8 5.33-8-5.33V6h16z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 4h10m-10 0a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-moons-muted">
      <span className="text-moons-silver">{icon}</span>
      {children}
    </span>
  );
}

function ProfileBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'brand';
}) {
  const styles = {
    default: 'bg-surface text-moons-muted ring-1 ring-border/60',
    success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300',
    brand: 'bg-moons-blue/10 text-moons-blue ring-1 ring-moons-blue/20',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}

function ProfileActionBar({
  userId,
  fullName,
  headline,
  avatarUrl,
  connectionStatus,
  connectionId,
  connectionDirection,
  onUpdated,
}: {
  userId: string;
  fullName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  connectionStatus: string;
  connectionId: string | null;
  connectionDirection: 'sent' | 'received' | null;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const router = useRouter();

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
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LiButton variant="primary" onClick={() => setShowMessage(true)}>
            <MessageIcon />
            Message
          </LiButton>
          <ShareProfileMenu userId={userId} fullName={fullName} headline={headline} />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => removeConnection(userId))}
          className="text-xs font-medium text-moons-muted transition hover:text-red-600 disabled:opacity-60"
        >
          Remove connection
        </button>
        <MessageComposeModal
          open={showMessage}
          userId={userId}
          fullName={fullName}
          headline={headline}
          avatarUrl={avatarUrl}
          onClose={() => setShowMessage(false)}
          onSent={(conversationId) => router.push(`/messages?conversation=${conversationId}`)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionDirection === 'received' && connectionId) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap justify-end gap-2">
          <LiButton variant="primary" disabled={loading} onClick={() => run(() => acceptConnection(connectionId))}>
            Accept
          </LiButton>
          <LiButton variant="outline" disabled={loading} onClick={() => run(() => rejectConnection(connectionId))}>
            Ignore
          </LiButton>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionId) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <LiButton variant="outline" disabled>
          Pending
        </LiButton>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => cancelConnection(connectionId))}
          className="text-xs font-medium text-moons-muted transition hover:text-heading disabled:opacity-60"
        >
          Withdraw invitation
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <ConnectInviteModal
        open={showInvite}
        userId={userId}
        fullName={fullName}
        headline={headline}
        avatarUrl={avatarUrl}
        onClose={() => setShowInvite(false)}
        onSent={() => onUpdated()}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <LiButton variant="primary" onClick={() => setShowInvite(true)}>
          Connect
        </LiButton>
        <ShareProfileMenu userId={userId} fullName={fullName} headline={headline} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function OrgAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-surface to-surface-hover text-sm font-bold text-moons-navy ring-1 ring-border/70">
      {initial}
    </div>
  );
}

function TimelineItem({
  logo,
  title,
  subtitle,
  meta,
  description,
  isLast,
}: {
  logo: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-px bg-border/70" aria-hidden />
      )}
      <div className="relative z-[1]">{logo}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="text-[15px] font-semibold leading-snug text-heading">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-foreground">{subtitle}</p>}
        {meta && <p className="mt-1 text-xs text-moons-muted">{meta}</p>}
        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">{description}</p>
        )}
      </div>
    </div>
  );
}

function ProfileAvatar({
  avatar,
  name,
  openToWork,
}: {
  avatar: string | null;
  name: string;
  openToWork?: boolean;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0">
      {openToWork && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-full border-[3px] border-moons-blue sm:-inset-1.5 sm:border-4"
          aria-hidden
        />
      )}
      <div className="relative flex h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-surface to-surface-hover text-3xl font-semibold text-moons-navy ring-[3px] ring-surface-elevated sm:h-[148px] sm:w-[148px] sm:text-4xl sm:ring-4">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {openToWork && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-moons-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          {OPEN_ON_MOONS_LABEL}
        </span>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-moons-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-moons-blue hover:underline"
    >
      {label}
    </a>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1128px] animate-pulse px-4 py-6 sm:px-6">
      <div className={`${PROFILE_CARD} mb-2`}>
        <div className="h-[200px] bg-surface" />
        <div className="px-6 pb-6">
          <div className="-mt-16 flex gap-5">
            <div className="h-[148px] w-[148px] rounded-full bg-surface ring-4 ring-surface-elevated" />
            <div className="mt-16 flex-1 space-y-3">
              <div className="h-7 w-52 rounded bg-surface" />
              <div className="h-4 w-72 rounded bg-surface" />
              <div className="h-3 w-44 rounded bg-surface" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`${PROFILE_CARD} h-56 bg-surface`} />
        <div className={`${PROFILE_CARD} h-44 bg-surface`} />
      </div>
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
    return (
      <div className="li-page-bg">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="li-page-bg px-4 py-16 text-center">
        <p className="text-sm text-red-600">{error || 'Profile not found'}</p>
        <Link href="/network" className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline">
          ← Back to My Network
        </Link>
      </div>
    );
  }

  const { profile } = data;
  const limited = Boolean(profile.limited);
  const displayName = profile.fullName?.trim() || 'Professional';
  const firstName = displayName.split(' ')[0];
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
  const isConnected = connectionStatus === 'ACCEPTED';
  const isHiring = Boolean(profile.isHiring);
  const location = profile.location ? String(profile.location) : null;
  const currentCompany = profile.currentCompany ? String(profile.currentCompany) : null;
  const experienceYears =
    typeof profile.experienceYears === 'number' ? profile.experienceYears : null;
  const email = profile.email ? String(profile.email) : null;
  const phone = profile.phone ? String(profile.phone) : null;
  const linkedinUrl = profile.linkedinUrl ? String(profile.linkedinUrl) : null;
  const githubUrl = profile.githubUrl ? String(profile.githubUrl) : null;
  const personalWebsiteUrl = profile.personalWebsiteUrl ? String(profile.personalWebsiteUrl) : null;
  const openToWork = Boolean(profile.openToWork);
  const showOpenOnMoons = showOpenOnMoonsToViewer(
    openToWork,
    user?.role,
    isOwnProfile,
  );

  return (
    <div className="li-page-bg pb-12">
      <div className="mx-auto max-w-[1128px] px-4 pt-3 sm:px-6 sm:pt-5">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-2 text-xs text-moons-muted" aria-label="Breadcrumb">
          <Link href="/network" className="font-medium transition hover:text-moons-blue">
            My Network
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate font-medium text-heading">{displayName}</span>
        </nav>

        {/* Header */}
        <article className={PROFILE_CARD}>
          <CoverPhotoBanner
            bannerUrl={bannerUrl}
            updatedAt={profile.updatedAt ? String(profile.updatedAt) : null}
            editable={isOwnProfile}
            onUpdated={(nextBannerUrl, updatedAt) => {
              setData((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, bannerUrl: nextBannerUrl, updatedAt } }
                  : prev,
              );
            }}
          />

          <div className="relative bg-surface-elevated px-4 pb-6 sm:px-6">
            <div className="relative z-10 flex justify-end pb-2 sm:absolute sm:right-6 sm:top-4 sm:pb-0">
              {isOwnProfile ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ShareProfileMenu
                    userId={profile.userId}
                    fullName={displayName}
                    headline={profile.headline ? String(profile.headline) : null}
                  />
                  <Link
                    href="/profile"
                    className="inline-flex h-8 items-center rounded-full border border-border bg-surface-elevated px-4 text-[13px] font-semibold text-heading transition hover:border-moons-muted/50 hover:bg-surface"
                  >
                    Edit profile
                  </Link>
                </div>
              ) : (
                !limited && (
                  <ProfileActionBar
                    userId={profile.userId}
                    fullName={displayName}
                    headline={profile.headline ? String(profile.headline) : null}
                    avatarUrl={profile.avatarUrl ? String(profile.avatarUrl) : null}
                    connectionStatus={connectionStatus}
                    connectionId={data.connectionId}
                    connectionDirection={data.connectionDirection}
                    onUpdated={reload}
                  />
                )
              )}
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
              <div className="-mt-14 shrink-0 sm:-mt-[74px]">
                <ProfileAvatar
                  avatar={avatar}
                  name={displayName}
                  openToWork={showOpenOnMoons && !isHiring}
                />
              </div>

              <div
                className={`min-w-0 flex-1 text-center sm:pt-9 sm:text-left ${
                  !isOwnProfile && !limited ? 'sm:pr-52' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-[22px] font-semibold tracking-tight text-heading sm:text-2xl">
                    {displayName}
                  </h1>
                  {isHiring && <ProfileBadge variant="brand">Hiring</ProfileBadge>}
                  {showOpenOnMoons && (
                    <ProfileBadge variant="brand">{OPEN_ON_MOONS_LABEL}</ProfileBadge>
                  )}
                  {isConnected && !isOwnProfile && <ProfileBadge variant="success">1st</ProfileBadge>}
                </div>

                {profile.headline && (
                  <p className="mt-1.5 text-[15px] leading-snug text-foreground">{profile.headline}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:justify-start">
                  {location && (
                    <MetaItem icon={<MapPinIcon className="h-4 w-4" />}>{location}</MetaItem>
                  )}
                  {currentCompany && (
                    <MetaItem icon={<BuildingIcon className="h-4 w-4" />}>{currentCompany}</MetaItem>
                  )}
                  {experienceYears != null && (
                    <MetaItem icon={<BriefcaseIcon className="h-4 w-4" />}>
                      {experienceYears}+ years experience
                    </MetaItem>
                  )}
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-semibold text-moons-blue">{data.connectionCount}</span>
                  <span className="text-moons-muted">
                    {' '}
                    connection{data.connectionCount === 1 ? '' : 's'}
                  </span>
                  {data.mutualConnections.count > 0 && (
                    <span className="text-moons-muted"> · {data.mutualConnections.count} mutual</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </article>

        {limited ? (
          <div className={`${PROFILE_CARD} mt-2 p-6 text-sm leading-relaxed text-moons-muted`}>
            This profile is private or only visible to connections. Connect with {firstName} to see their full
            profile.
          </div>
        ) : (
          <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_312px]">
            <div className="space-y-2">
              {Boolean(profile.summary) && (
                <SectionCard title="About">
                  <p className="whitespace-pre-wrap text-sm leading-[1.7] text-foreground">
                    {String(profile.summary)}
                  </p>
                </SectionCard>
              )}

              {workExperiences.length > 0 && (
                <SectionCard title="Experience" subtitle={`${workExperiences.length} position${workExperiences.length === 1 ? '' : 's'}`}>
                  {workExperiences.map((exp, i) => (
                    <TimelineItem
                      key={i}
                      logo={<OrgAvatar name={exp.company || 'Company'} />}
                      title={exp.designation || 'Role'}
                      subtitle={exp.company}
                      meta={`${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`}
                      description={exp.description}
                      isLast={i === workExperiences.length - 1}
                    />
                  ))}
                </SectionCard>
              )}

              {educations.length > 0 && (
                <SectionCard title="Education">
                  {educations.map((edu, i) => (
                    <TimelineItem
                      key={i}
                      logo={<OrgAvatar name={edu.institute || 'School'} />}
                      title={edu.institute || 'Institution'}
                      subtitle={[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}
                      meta={edu.year}
                      isLast={i === educations.length - 1}
                    />
                  ))}
                </SectionCard>
              )}

              {skills.length > 0 && (
                <SectionCard title="Skills" subtitle={`${skills.length} listed`}>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-border/70 bg-surface/50 px-3 py-1.5 text-sm font-medium text-heading"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {data.sharedSkills.length > 0 && (
                <SectionCard
                  title="Shared skills"
                  subtitle={`You and ${firstName} have ${data.sharedSkills.length} skill${data.sharedSkills.length === 1 ? '' : 's'} in common`}
                >
                  <div className="flex flex-wrap gap-2">
                    {data.sharedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-moons-blue/25 bg-moons-blue/8 px-3 py-1.5 text-sm font-semibold text-moons-blue"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {certifications.length > 0 && (
                <SectionCard title="Licenses & certifications">
                  {certifications.map((cert, i) => (
                    <TimelineItem
                      key={i}
                      logo={<OrgAvatar name={cert.issuer || cert.name || 'C'} />}
                      title={cert.name || 'Certification'}
                      subtitle={cert.issuer}
                      meta={cert.year}
                      isLast={i === certifications.length - 1}
                    />
                  ))}
                </SectionCard>
              )}

              {data.mutualConnections.items.length > 0 && (
                <SectionCard
                  title="Mutual connections"
                  subtitle={`${data.mutualConnections.count} mutual connection${data.mutualConnections.count === 1 ? '' : 's'}`}
                >
                  <div className="divide-y divide-border/50">
                    {data.mutualConnections.items.map((person) => (
                      <Link
                        key={person.userId}
                        href={`/network/${person.userId}`}
                        className="flex items-center gap-3 py-3 transition first:pt-0 last:pb-0 hover:opacity-90"
                      >
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-moons-muted ring-1 ring-border/60">
                          {person.avatarUrl ? (
                            <img
                              src={resolveAvatarUrl(person.avatarUrl) ?? ''}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (person.fullName ?? '?').charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-heading">{person.fullName}</p>
                          <p className="truncate text-xs text-moons-muted">{person.headline}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            <aside className="space-y-2">
              {(preferredRoles.length > 0 || preferredLocations.length > 0) && (
                <section className={`${PROFILE_CARD} border-emerald-200/60 bg-gradient-to-b from-emerald-50/80 to-surface-elevated p-4 dark:from-emerald-950/20`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
                    <h2 className="text-sm font-semibold text-heading">Open to opportunities</h2>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {preferredRoles.length > 0 && (
                      <p className="font-medium leading-snug text-heading">{preferredRoles.join(' · ')}</p>
                    )}
                    {preferredLocations.length > 0 && (
                      <p className="text-moons-muted">{preferredLocations.join(' · ')}</p>
                    )}
                  </div>
                </section>
              )}

              <SectionCard title="Contact information" compact>
                <dl className="space-y-4">
                  {email && (
                    <ContactRow icon={<MailIcon className="h-4 w-4" />} label="Email">
                      <span className="break-all">{email}</span>
                    </ContactRow>
                  )}
                  {phone && (
                    <ContactRow icon={<PhoneIcon className="h-4 w-4" />} label="Phone">
                      {phone}
                    </ContactRow>
                  )}
                  {linkedinUrl && (
                    <ContactRow icon={<LinkIcon className="h-4 w-4" />} label="LinkedIn">
                      <ExternalLink href={linkedinUrl} label="View profile" />
                    </ContactRow>
                  )}
                  {githubUrl && (
                    <ContactRow icon={<LinkIcon className="h-4 w-4" />} label="GitHub">
                      <ExternalLink href={githubUrl} label="View profile" />
                    </ContactRow>
                  )}
                  {personalWebsiteUrl && (
                    <ContactRow icon={<LinkIcon className="h-4 w-4" />} label="Website">
                      <ExternalLink href={personalWebsiteUrl} label="Visit website" />
                    </ContactRow>
                  )}
                </dl>
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex h-9 w-full items-center justify-center rounded-full border border-moons-blue text-[13px] font-semibold text-moons-blue transition hover:bg-moons-blue/5"
                  >
                    View resume
                  </a>
                )}
              </SectionCard>

              {(careerGoals.length > 0 || interests.length > 0) && (
                <SectionCard title="Interests & goals" compact>
                  {interests.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-moons-muted">Professional interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((item) => (
                          <span
                            key={item}
                            className="rounded-md border border-border/60 bg-surface/40 px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {careerGoals.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-moons-muted">Career goals</p>
                      <ul className="space-y-1.5">
                        {careerGoals.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-foreground">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-moons-blue" aria-hidden />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </SectionCard>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
