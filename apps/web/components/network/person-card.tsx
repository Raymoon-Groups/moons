'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  acceptConnection,
  cancelConnection,
  rejectConnection,
  removeConnection,
  sendConnectionRequest,
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
  'inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moons-blue/40';
const btnPrimary = `${btnBase} bg-gradient-to-r from-moons-navy to-moons-blue text-white shadow-lg shadow-moons-navy/15 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60`;
const btnSecondary = `${btnBase} bg-surface/80 text-foreground shadow-sm ring-1 ring-border/30 hover:bg-surface`;
const btnGhost = `${btnBase} text-moons-muted hover:bg-surface/80 hover:text-foreground`;

function ConnectActions({
  userId,
  connectionStatus,
  connectionId,
  connectionDirection,
  onUpdated,
  onConnectionChange,
  layout = 'stacked',
}: {
  userId: string;
  connectionStatus: string;
  connectionId?: string | null;
  connectionDirection?: 'sent' | 'received' | null;
  onUpdated?: () => void;
  onConnectionChange?: (update: ConnectionUpdate) => void;
  layout?: 'stacked' | 'inline';
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        <p className="text-center text-[10px] font-medium uppercase tracking-wide text-emerald-600">
          Connected
        </p>
        <Link href={`/network/${userId}`} className={btnSecondary}>
          View profile
        </Link>
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
          Remove
        </button>
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING' && connectionDirection === 'received' && connectionId) {
    return (
      <div className="space-y-2">
        <p className="text-center text-[10px] font-medium uppercase tracking-wide text-amber-700">
          Wants to connect
        </p>
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
            Decline
          </button>
        </div>
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  if (connectionStatus === 'PENDING') {
    return (
      <div className="space-y-2">
        <p className="text-center text-[10px] font-medium uppercase tracking-wide text-amber-700">
          Pending
        </p>
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
            className={btnSecondary}
          >
            Cancel request
          </button>
        ) : null}
        {error && <p className="text-center text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(() => sendConnectionRequest(userId))}
        className={btnPrimary}
      >
        {loading ? 'Sending…' : 'Connect'}
      </button>
      {error && <p className="mt-1.5 text-center text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

function PersonAvatar({ person }: { person: NetworkUserCard }) {
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const initial = (person.fullName ?? '?').charAt(0).toUpperCase();

  return (
    <Link href={`/network/${person.userId}`} className="relative z-10 mx-auto block shrink-0">
      <div className="absolute inset-0 -m-2 rounded-full bg-moons-blue/15 blur-xl" aria-hidden />
      <div className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-surface-elevated text-lg font-bold text-moons-navy shadow-lg ring-2 ring-white/80 dark:ring-surface-elevated/80">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
    </Link>
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
    <article className={`${CARD_SHELL} ring-1 ring-emerald-200/70 dark:ring-emerald-800/50`}>
      <StatusBadges person={person} align="left" />
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 z-10 rounded-full bg-surface-elevated/90 p-1.5 text-moons-muted shadow-sm transition hover:text-foreground"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-1 flex-col items-center px-5 pb-4 pt-8 text-center">{children}</div>

      <div className="mt-auto rounded-b-[1.75rem] bg-emerald-50 px-5 py-4 dark:bg-emerald-950/30">
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
    <div className="flex flex-col gap-2.5">
      <p className="text-center text-[10px] font-medium uppercase tracking-wide text-emerald-600">Connected</p>
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
  if (!person.openToWork && !person.isHiring) {
    return null;
  }

  const badgeClass =
    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shadow-sm';

  const badges = (
    <>
      {person.isHiring && (
        <span className={`${badgeClass} bg-moons-blue text-white`}>Hiring</span>
      )}
      {person.openToWork && (
        <span className={`${badgeClass} bg-emerald-500 text-white`}>Open</span>
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
  'group relative flex h-full min-h-[248px] flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated/95 shadow-[0_8px_30px_rgba(26,39,68,0.07)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,39,68,0.12)]';

const FOOTER_SHELL = 'mt-auto px-5 pb-5 pt-3';

export function PersonCard({
  person,
  variant = 'discovery',
  showConnect = true,
  embedded = false,
  message,
  onUpdated,
  onConnectionChange,
  onDismiss,
}: {
  person: NetworkUserCard;
  variant?: PersonCardVariant;
  showConnect?: boolean;
  embedded?: boolean;
  message?: string;
  onUpdated?: () => void;
  onConnectionChange?: (userId: string, update: ConnectionUpdate) => void;
  onDismiss?: () => void;
}) {
  const [status, setStatus] = useState(person.connectionStatus ?? 'NONE');
  const [connectionId, setConnectionId] = useState(person.connectionId ?? null);
  const [direction, setDirection] = useState(person.connectionDirection ?? null);
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
  const showCelebration = variant === 'discovery' && isAccepted;
  const showConnected = variant === 'network' && isAccepted;

  function handleConnectionChange(update: ConnectionUpdate) {
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
        connectionStatus={status}
        connectionId={connectionId}
        connectionDirection={direction}
        onUpdated={onUpdated}
        onConnectionChange={handleConnectionChange}
        layout={embedded ? 'inline' : 'stacked'}
      />
    );
  }

  const profileBody = (
    <>
      {!embedded && (
        <div className="relative mb-3">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-gradient-to-b from-moons-blue/25 to-transparent blur-sm"
            aria-hidden
          />
          <PersonAvatar person={person} />
        </div>
      )}

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
        <div className="w-full space-y-1 px-1">
          <Link
            href={`/network/${person.userId}`}
            className="block truncate text-[15px] font-bold leading-tight text-heading transition group-hover:text-moons-blue"
          >
            {person.fullName ?? 'Professional'}
          </Link>
          {person.headline && (
            <p className="line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-foreground/70">{person.headline}</p>
          )}
          {subtitle ? (
            <p className="truncate text-[11px] text-moons-muted">{subtitle}</p>
          ) : (
            <span className="block min-h-[1rem]" aria-hidden />
          )}
        </div>
      )}

      {embedded && subtitle && <p className="mb-2 truncate text-[11px] text-moons-muted">{subtitle}</p>}

      {message && (
        <p className="mt-3 w-full rounded-2xl bg-surface/60 px-3 py-2.5 text-left text-xs leading-relaxed text-moons-muted">
          &ldquo;{message}&rdquo;
        </p>
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
        {profileBody}
      </CelebrationCardShell>
    );
  }

  const body = (
    <div className={`flex flex-1 flex-col ${embedded ? 'items-start text-left' : 'items-center text-center'}`}>
      {profileBody}
    </div>
  );

  if (embedded) {
    return (
      <article className={`${CARD_SHELL} p-5`}>
        <StatusBadges person={person} align="right" />
        {body}
        {footerContent && <div className={FOOTER_SHELL}>{footerContent}</div>}
      </article>
    );
  }

  return (
    <article className={CARD_SHELL}>
      <StatusBadges person={person} align="right" />
      <div className="flex flex-1 flex-col px-5 pb-2 pt-8">{body}</div>
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
      connectionStatus={props.connectionStatus ?? 'NONE'}
      connectionId={props.connectionId}
      connectionDirection={props.connectionDirection}
      onUpdated={props.onUpdated}
      onConnectionChange={props.onConnectionChange}
      layout={props.layout}
    />
  );
}
