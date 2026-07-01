'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  OPEN_ON_MOONS_LABEL,
  showOpenOnMoonsToViewer,
} from '@/lib/open-on-moons';
import { useAuth } from '@/lib/auth-context';
import {
  ConnectInviteModal,
  formatRecommendationReason,
} from '@/components/network/network-modals';
import {
  acceptConnection,
  cancelConnection,
  rejectConnection,
  removeConnection,
} from '@/lib/network';
import type { NetworkUserCard } from '@moons/shared';

export type ConnectionUpdate = {
  connectionId: string;
  connectionStatus: string;
  connectionDirection: 'sent' | 'received' | null;
};

export type PersonCardVariant = 'discovery' | 'network';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

const btnBase =
  'inline-flex h-8 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moons-blue/40';
const btnPrimary = `${btnBase} bg-moons-blue text-white hover:bg-moons-blue-dark disabled:opacity-60`;
const btnSecondary = `${btnBase} border border-border bg-surface-elevated text-heading hover:bg-surface`;
const btnGhost = `${btnBase} text-moons-muted hover:bg-surface hover:text-foreground`;
const btnOutline = `${btnBase} border border-foreground/40 bg-transparent text-heading hover:bg-surface disabled:opacity-60`;

function SuggestionContext({ person }: { person: NetworkUserCard }) {
  const reason = formatRecommendationReason(person.recommendationReason);
  const mutuals = person.mutualConnections ?? 0;
  const skills = person.sharedSkills?.slice(0, 3) ?? [];

  if (!reason && mutuals === 0 && skills.length === 0) return null;

  return (
    <div className="mt-2 w-full border-t border-border/50 pt-2.5 text-left">
      {reason && (
        <p className="text-[11px] leading-snug text-moons-muted">
          <span className="font-medium text-foreground/80">Based on your profile: </span>
          {reason}
        </p>
      )}
      {mutuals > 0 && (
        <p className={`text-[11px] font-semibold text-moons-blue ${reason ? 'mt-1' : ''}`}>
          {mutuals} mutual connection{mutuals === 1 ? '' : 's'}
        </p>
      )}
      {skills.length > 0 && (
        <div className={`flex flex-wrap justify-center gap-1 sm:justify-start ${reason || mutuals ? 'mt-1.5' : ''}`}>
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-moons-blue/8 px-2 py-0.5 text-[10px] font-medium text-moons-blue ring-1 ring-moons-blue/15"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectActions({
  userId,
  fullName,
  headline,
  avatarUrl,
  connectionStatus,
  connectionId,
  connectionDirection,
  onUpdated,
  onConnectionChange,
  layout = 'stacked',
}: {
  userId: string;
  fullName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  connectionStatus: string;
  connectionId?: string | null;
  connectionDirection?: 'sent' | 'received' | null;
  onUpdated?: () => void;
  onConnectionChange?: (update: ConnectionUpdate) => void;
  layout?: 'stacked' | 'inline';
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  async function applyUpdate(update: ConnectionUpdate) {
    onConnectionChange?.(update);
  }

  async function run(
    action: () => Promise<unknown>,
    options?: { refreshAll?: boolean; update?: ConnectionUpdate },
  ) {
    const { refreshAll = false, update } = options ?? {};
    setLoading(true);
    setError('');
    try {
      const result = await action();
      if (update) {
        await applyUpdate(update);
      } else if (result && typeof result === 'object' && 'id' in result) {
        await applyUpdate({
          connectionId: String((result as { id: string }).id),
          connectionStatus: 'PENDING',
          connectionDirection: 'sent',
        });
      }
      if (refreshAll) onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  if (connectionStatus === 'ACCEPTED') {
    return (
      <div className="space-y-2">
        <Link href={`/network/${userId}`} className={btnSecondary}>
          View profile
        </Link>
        {onUpdated && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              run(
                async () => {
                  await removeConnection(userId);
                },
                {
                  refreshAll: true,
                  update: {
                    connectionId: '',
                    connectionStatus: 'NONE',
                    connectionDirection: null,
                  },
                },
              )
            }
            className={btnGhost}
          >
            Remove connection
          </button>
        )}
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionDirection === 'received' && connectionId) {
    return (
      <div className="space-y-2">
        <div className={layout === 'inline' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              run(
                async () => {
                  await acceptConnection(connectionId);
                },
                {
                  update: {
                    connectionId,
                    connectionStatus: 'ACCEPTED',
                    connectionDirection: null,
                  },
                },
              )
            }
            className={btnPrimary}
          >
            Accept
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              run(
                async () => {
                  await rejectConnection(connectionId);
                },
                {
                  refreshAll: true,
                  update: {
                    connectionId: '',
                    connectionStatus: 'NONE',
                    connectionDirection: null,
                  },
                },
              )
            }
            className={btnSecondary}
          >
            Ignore
          </button>
        </div>
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING') {
    return (
      <div className="space-y-2">
        <button type="button" disabled className={btnOutline}>
          Pending
        </button>
        {connectionId ? (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              run(
                async () => {
                  await cancelConnection(connectionId);
                },
                {
                  refreshAll: true,
                  update: {
                    connectionId: '',
                    connectionStatus: 'NONE',
                    connectionDirection: null,
                  },
                },
              )
            }
            className={btnGhost}
          >
            Withdraw
          </button>
        ) : null}
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <ConnectInviteModal
        open={showInvite}
        userId={userId}
        fullName={fullName}
        headline={headline}
        avatarUrl={avatarUrl}
        onClose={() => setShowInvite(false)}
        onSent={(id) => {
          applyUpdate({
            connectionId: id,
            connectionStatus: 'PENDING',
            connectionDirection: 'sent',
          });
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => setShowInvite(true)}
        className={btnPrimary}
      >
        Connect
      </button>
      {error && <p className="mt-1.5 text-center text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

function PersonAvatar({ person, size = 'md' }: { person: NetworkUserCard; size?: 'md' | 'sm' }) {
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const initial = (person.fullName ?? '?').charAt(0).toUpperCase();
  const dim = size === 'sm' ? 'h-12 w-12 text-base' : 'h-[72px] w-[72px] text-xl';

  return (
    <Link href={`/network/${person.userId}`} className="relative z-10 mx-auto block shrink-0">
      <div
        className={`relative flex ${dim} items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-surface to-surface-hover font-semibold text-moons-navy ring-[3px] ring-surface-elevated`}
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
    </Link>
  );
}

function CardBanner() {
  return (
    <div
      className="h-12 w-full bg-gradient-to-r from-moons-blue/25 via-moons-blue/12 to-surface sm:h-14"
      aria-hidden
    />
  );
}

function AcceptedCelebrationFooter({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <CheckIcon className="h-3 w-3" />
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold leading-tight text-emerald-900 dark:text-emerald-100">
            Invitation accepted
          </p>
          <p className="text-[10px] leading-tight text-emerald-700 dark:text-emerald-300">
            You&apos;re now connected
          </p>
        </div>
      </div>
      <Link href={`/network/${userId}`} className={btnSecondary}>
        View profile
      </Link>
    </div>
  );
}

function CelebrationCardShell({
  person,
  onDismiss,
  children,
  footer,
}: {
  person: NetworkUserCard;
  onDismiss: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <article className={`${CARD_SHELL} ring-1 ring-emerald-300/50`}>
      <CardBanner />
      <StatusBadges person={person} align="right" />
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 z-10 rounded-full p-1 text-moons-muted transition hover:bg-surface-elevated hover:text-foreground"
      >
        <CloseIcon className="h-4 w-4" />
      </button>

      <div className="-mt-9 flex flex-1 flex-col items-center px-4 pb-3 pt-0 text-center">{children}</div>

      <div className="border-t border-emerald-200/60 bg-emerald-50/80 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
        {footer}
      </div>
    </article>
  );
}

function ConnectedFooter({
  userId,
  onRemove,
  removing,
}: {
  userId: string;
  onRemove?: () => void;
  removing?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-semibold text-emerald-700">Connected</p>
      <Link href={`/messages?with=${userId}`} className={btnPrimary}>
        Message
      </Link>
      <Link href={`/network/${userId}`} className={btnSecondary}>
        View profile
      </Link>
      {onRemove && (
        <button type="button" disabled={removing} onClick={onRemove} className={btnGhost}>
          Remove
        </button>
      )}
    </div>
  );
}

function StatusBadges({
  person,
  position = 'corner',
  align = 'right',
}: {
  person: NetworkUserCard;
  position?: 'corner' | 'inline';
  align?: 'left' | 'right';
}) {
  const { user } = useAuth();
  const showOpen = showOpenOnMoonsToViewer(
    person.openToWork,
    user?.role,
    user?.id === person.userId,
  );

  if (!showOpen && !person.isHiring) {
    return null;
  }

  const badgeClass =
    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shadow-sm';

  const badges = (
    <>
      {person.isHiring && (
        <span className={`${badgeClass} bg-moons-blue text-white`}>Hiring</span>
      )}
      {showOpen && (
        <span className={`${badgeClass} bg-moons-navy text-white`}>{OPEN_ON_MOONS_LABEL}</span>
      )}
    </>
  );

  if (position === 'inline') {
    return <span className="inline-flex flex-wrap gap-1">{badges}</span>;
  }

  return (
    <div
      className={`absolute top-2.5 z-[1] flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1 ${
        align === 'left' ? 'left-2.5' : 'right-2.5'
      }`}
    >
      {badges}
    </div>
  );
}

const CARD_SHELL =
  'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-surface-elevated shadow-sm transition hover:border-moons-blue/30 hover:shadow-[0_8px_24px_rgba(74,127,212,0.1)]';

const FOOTER_SHELL = 'mt-auto border-t border-border/50 px-4 py-3';

export function PersonCard({
  person,
  variant = 'discovery',
  showConnect = true,
  embedded = false,
  message,
  messageLabel = 'Personal note',
  onUpdated,
  onConnectionChange,
  onDismiss,
}: {
  person: NetworkUserCard;
  variant?: PersonCardVariant;
  showConnect?: boolean;
  embedded?: boolean;
  message?: string;
  messageLabel?: string;
  onUpdated?: () => void;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onDismiss?: () => void;
}) {
  const [status, setStatus] = useState(person.connectionStatus ?? 'NONE');
  const [connectionId, setConnectionId] = useState(person.connectionId ?? null);
  const [direction, setDirection] = useState(person.connectionDirection ?? null);
  const [celebrating, setCelebrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setStatus(person.connectionStatus ?? 'NONE');
    setConnectionId(person.connectionId ?? null);
    setDirection(person.connectionDirection ?? null);
  }, [person.connectionStatus, person.connectionId, person.connectionDirection]);

  if (dismissed) {
    return null;
  }

  const subtitle = [person.currentCompany, person.location].filter(Boolean).join(' · ');
  const isAccepted = status === 'ACCEPTED';
  const showCelebration = variant === 'discovery' && isAccepted && celebrating;
  const showConnected = isAccepted && !showCelebration;

  function handleConnectionChange(update: ConnectionUpdate) {
    if (update.connectionStatus === 'ACCEPTED' && status !== 'ACCEPTED') {
      setCelebrating(true);
    }
    setStatus(update.connectionStatus);
    setConnectionId(update.connectionId || null);
    setDirection(update.connectionDirection);
    onConnectionChange?.(person.userId, update);
  }

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeConnection(person.userId);
      handleConnectionChange({
        connectionId: '',
        connectionStatus: 'NONE',
        connectionDirection: null,
      });
      onUpdated?.();
    } finally {
      setRemoving(false);
    }
  }

  let footerContent: React.ReactNode = null;
  if (showConnect && showConnected) {
    footerContent = (
      <ConnectedFooter userId={person.userId} onRemove={onUpdated ? handleRemove : undefined} removing={removing} />
    );
  } else if (showConnect && !isAccepted) {
    footerContent = (
      <ConnectActions
        userId={person.userId}
        fullName={person.fullName ?? 'Professional'}
        headline={person.headline}
        avatarUrl={person.avatarUrl}
        connectionStatus={status}
        connectionId={connectionId}
        connectionDirection={direction}
        onUpdated={onUpdated}
        onConnectionChange={handleConnectionChange}
        layout={embedded ? 'inline' : 'stacked'}
      />
    );
  } else if (!showConnect) {
    footerContent = (
      <Link href={`/network/${person.userId}`} className={btnSecondary}>
        View profile
      </Link>
    );
  }

  const profileText = (
    <>
      {embedded && (
        <div className="mb-3 flex w-full items-start gap-3 text-left">
          <Link href={`/network/${person.userId}`} className="shrink-0">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface text-base font-bold text-moons-muted ring-2 ring-border">
              {resolveAvatarUrl(person.avatarUrl) ? (
                <img
                  src={resolveAvatarUrl(person.avatarUrl)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (person.fullName ?? '?').charAt(0).toUpperCase()
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start gap-1.5">
              <Link
                href={`/network/${person.userId}`}
                className="min-w-0 flex-1 truncate text-sm font-bold text-heading hover:text-moons-blue"
              >
                {person.fullName ?? 'Professional'}
              </Link>
              <StatusBadges person={person} position="inline" />
            </div>
            {person.headline && (
              <p className="mt-0.5 line-clamp-2 text-xs text-moons-muted">{person.headline}</p>
            )}
          </div>
        </div>
      )}

      {!embedded && (
        <div className="w-full space-y-0.5 text-center">
          <Link
            href={`/network/${person.userId}`}
            className="block truncate text-[15px] font-semibold leading-tight text-heading transition hover:text-moons-blue hover:underline"
          >
            {person.fullName ?? 'Professional'}
          </Link>
          {person.headline && (
            <p className="line-clamp-2 text-xs leading-snug text-moons-muted">{person.headline}</p>
          )}
          {subtitle && <p className="truncate text-[11px] text-moons-muted/90">{subtitle}</p>}
          {variant === 'discovery' && <SuggestionContext person={person} />}
        </div>
      )}

      {embedded && subtitle && <p className="mb-2 truncate text-[11px] text-moons-muted">{subtitle}</p>}

      {message && (
        <div className="mt-3 w-full rounded-md border border-border/50 bg-surface/50 px-3 py-2.5 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-moons-muted">
            {messageLabel}
          </p>
          <p className="mt-1 text-xs italic leading-relaxed text-foreground/90">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      )}
    </>
  );

  if (showConnect && showCelebration) {
    return (
      <CelebrationCardShell
        person={person}
        onDismiss={handleDismiss}
        footer={<AcceptedCelebrationFooter userId={person.userId} />}
      >
        <div className="-mt-9 mb-2">
          <PersonAvatar person={person} />
        </div>
        {profileText}
      </CelebrationCardShell>
    );
  }

  const body = (
    <div className={`flex flex-1 flex-col ${embedded ? 'items-start text-left' : 'items-center text-center'}`}>
      {profileText}
    </div>
  );

  if (embedded) {
    return (
      <article className={`${CARD_SHELL} p-4`}>
        <StatusBadges person={person} align="right" />
        {body}
        {footerContent && <div className={FOOTER_SHELL}>{footerContent}</div>}
      </article>
    );
  }

  return (
    <article className={CARD_SHELL}>
      {variant === 'discovery' && onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss suggestion"
          className="absolute right-2 top-2 z-10 rounded-full p-1 text-moons-muted transition hover:bg-surface hover:text-foreground"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
      <CardBanner />
      <StatusBadges person={person} align="right" />
      <div className="-mt-9 flex flex-1 flex-col px-4 pb-3 pt-0">
        <div className="mb-2 flex justify-center">
          <PersonAvatar person={person} />
        </div>
        {body}
      </div>
      {footerContent && <div className={FOOTER_SHELL}>{footerContent}</div>}
    </article>
  );
}

/** @deprecated Use ConnectActions inside PersonCard */
export function ConnectButton(props: {
  userId: string;
  connectionStatus?: string;
  connectionId?: string | null;
  connectionDirection?: 'sent' | 'received' | null;
  onUpdated?: () => void;
  onConnectionChange?: (update: ConnectionUpdate) => void;
  onAccepted?: () => void;
  compact?: boolean;
  layout?: 'stacked' | 'inline';
}) {
  return (
    <ConnectActions
      userId={props.userId}
      fullName="Professional"
      connectionStatus={props.connectionStatus ?? 'NONE'}
      connectionId={props.connectionId}
      connectionDirection={props.connectionDirection}
      onUpdated={props.onUpdated}
      onConnectionChange={props.onConnectionChange}
      layout={props.layout}
    />
  );
}
