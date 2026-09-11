'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import {
  cancelConnection,
  fetchConnections,
  fetchPendingReceived,
  fetchPendingSent,
  fetchProfileVisitors,
  removeConnection,
  type ConnectionListItem,
  type PendingRequestItem,
  type ProfileVisitorItem,
} from '@/lib/network';

const SECTION_TABS = [
  { id: 'connections', label: 'My Connections', href: '/network?tab=connections' },
  { id: 'pending', label: 'Pending Requests', href: '/network?tab=pending' },
  { id: 'sent', label: 'Sent Requests', href: '/network?tab=sent' },
  { id: 'visitors', label: 'Profile Visitors', href: '/network' },
] as const;

type SectionTab = (typeof SECTION_TABS)[number]['id'];

const PREVIEW_LIMIT = 8;

export function ProfileNetworkSection() {
  const [tab, setTab] = useState<SectionTab>('connections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [pending, setPending] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [visitors, setVisitors] = useState<ProfileVisitorItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('networkTab');
    if (t === 'pending' || t === 'sent' || t === 'visitors' || t === 'connections') {
      setTab(t);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      switch (tab) {
        case 'connections': {
          const data = await fetchConnections();
          setConnections(data.items);
          break;
        }
        case 'pending': {
          const data = await fetchPendingReceived();
          setPending(data.items);
          break;
        }
        case 'sent': {
          const data = await fetchPendingSent();
          setSent(data.items);
          break;
        }
        case 'visitors': {
          const data = await fetchProfileVisitors();
          setVisitors(data.items);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeTab = SECTION_TABS.find((item) => item.id === tab) ?? SECTION_TABS[0];

  async function runAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  let rows: React.ReactNode = null;
  let totalCount = 0;
  let emptyMessage = '';

  if (tab === 'connections') {
    totalCount = connections.length;
    emptyMessage = 'No connections yet. Visit My Network to find people to connect with.';
    rows = connections.slice(0, PREVIEW_LIMIT).map((item) => (
      <NetworkPersonRow
        key={item.connectionId}
        userId={item.user.userId}
        fullName={item.user.fullName}
        headline={item.user.headline}
        avatarUrl={item.user.avatarUrl}
        meta={[item.user.currentCompany, item.user.location].filter(Boolean).join(' · ') || null}
        actions={
          <>
            <Link href={`/messages?with=${item.user.userId}`} className={btnPrimary}>
              Message
            </Link>
            <Link href={`/network/${item.user.userId}`} className={btnSecondary}>
              View
            </Link>
            <button
              type="button"
              disabled={busyId === item.connectionId}
              onClick={() =>
                void runAction(item.connectionId, () => removeConnection(item.user.userId))
              }
              className={btnGhost}
            >
              Remove
            </button>
          </>
        }
      />
    ));
  } else if (tab === 'pending') {
    totalCount = pending.length;
    emptyMessage =
      'No pending connection requests. New invites appear in the banner above and in Notifications.';
    rows = pending.slice(0, PREVIEW_LIMIT).map((item) =>
      item.fromUser ? (
        <NetworkPersonRow
          key={item.id}
          userId={item.fromUser.userId}
          fullName={item.fromUser.fullName}
          headline={item.fromUser.headline}
          avatarUrl={item.fromUser.avatarUrl}
          meta={item.message ? `“${item.message}”` : null}
          actions={
            <>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void runAction(item.id, () => acceptConnectionInvite(item.id))}
                className={btnPrimary}
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void runAction(item.id, () => ignoreConnectionInvite(item.id))}
                className={btnSecondary}
              >
                Ignore
              </button>
            </>
          }
        />
      ) : null,
    );
  } else if (tab === 'sent') {
    totalCount = sent.length;
    emptyMessage = 'You have not sent any connection requests.';
    rows = sent.slice(0, PREVIEW_LIMIT).map((item) =>
      item.toUser ? (
        <NetworkPersonRow
          key={item.id}
          userId={item.toUser.userId}
          fullName={item.toUser.fullName}
          headline={item.toUser.headline}
          avatarUrl={item.toUser.avatarUrl}
          meta="Request pending"
          actions={
            <>
              <Link href={`/network/${item.toUser.userId}`} className={btnSecondary}>
                View
              </Link>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void runAction(item.id, () => cancelConnection(item.id))}
                className={btnGhost}
              >
                Withdraw
              </button>
            </>
          }
        />
      ) : null,
    );
  } else {
    totalCount = visitors.length;
    emptyMessage = 'No profile visitors yet, or visitor tracking is disabled in privacy settings.';
    rows = visitors.slice(0, PREVIEW_LIMIT).map((item, index) => (
      <NetworkPersonRow
        key={`${item.viewer.userId}-${index}`}
        userId={item.viewer.userId}
        fullName={item.viewer.fullName}
        headline={item.viewer.headline}
        avatarUrl={item.viewer.avatarUrl}
        meta={`Viewed ${new Date(item.viewedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`}
        actions={
          <Link href={`/network/${item.viewer.userId}`} className={btnSecondary}>
            View
          </Link>
        }
      />
    ));
  }

  const hasMore = totalCount > PREVIEW_LIMIT;

  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-surface-elevated shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-heading">My network</h2>
          <p className="mt-0.5 text-xs text-moons-muted">
            Connections and visitors. Respond to invites from the banner above or Notifications.
          </p>
        </div>
        <Link
          href={activeTab.href}
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition hover:border-moons-blue/40 hover:text-moons-blue"
        >
          Open network
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-2">
        {SECTION_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 px-3 py-3 text-center text-xs font-semibold transition sm:px-4 sm:text-sm ${
              tab === item.id
                ? 'border-b-2 border-moons-blue text-moons-blue'
                : 'border-b-2 border-transparent text-moons-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-sm text-moons-muted">Loading…</p>
        ) : totalCount === 0 ? (
          <Empty message={emptyMessage} />
        ) : (
          <>
            <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-surface">
              {rows}
            </ul>
            {hasMore ? (
              <div className="mt-4 text-center">
                <Link
                  href={activeTab.href}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-heading transition hover:border-moons-blue/40 hover:text-moons-blue"
                >
                  Show all {totalCount}{' '}
                  {tab === 'connections'
                    ? 'connections'
                    : tab === 'pending'
                      ? 'requests'
                      : tab === 'sent'
                        ? 'sent requests'
                        : 'visitors'}
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

const btnBase =
  'inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold transition disabled:opacity-60';
const btnPrimary = `${btnBase} bg-moons-blue text-white hover:bg-moons-blue-dark`;
const btnSecondary = `${btnBase} border border-border bg-surface-elevated text-heading hover:bg-surface`;
const btnGhost = `${btnBase} text-moons-muted hover:bg-surface hover:text-foreground`;

function NetworkPersonRow({
  userId,
  fullName,
  headline,
  avatarUrl,
  meta,
  actions,
}: {
  userId: string;
  fullName: string | null;
  headline?: string | null;
  avatarUrl?: string | null;
  meta?: string | null;
  actions: React.ReactNode;
}) {
  const avatar = resolveAvatarUrl(avatarUrl);
  const name = fullName?.trim() || 'Professional';
  const initial = name.charAt(0).toUpperCase();

  return (
    <li className="flex flex-col gap-3 px-3.5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <Link href={`/network/${userId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-hover text-sm font-bold text-moons-navy ring-1 ring-border">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading hover:text-moons-blue">{name}</p>
          {headline ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-moons-muted">{headline}</p>
          ) : null}
          {meta ? <p className="mt-0.5 line-clamp-1 text-[11px] text-moons-muted/90">{meta}</p> : null}
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
    </li>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-moons-muted">{message}</p>
    </div>
  );
}
